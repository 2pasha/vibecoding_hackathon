import re
from typing import List, Dict, Tuple
import numpy as np
import faiss
from openai import OpenAI
from rank_bm25 import BM25Okapi
from .config import Config


class RetrievalPipeline:
    def __init__(self, metadata: List[Dict], bm25_index: BM25Okapi, 
                 faiss_index: faiss.IndexHNSWFlat, embeddings: np.ndarray):
        self.metadata = metadata
        self.bm25_index = bm25_index
        self.faiss_index = faiss_index
        self.embeddings = embeddings
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
    
    async def retrieve(self, query: str, max_results: int = 6) -> List[Dict]:
        """
        Retrieve relevant chunks using the pipeline defined in the brief:
        1. BM25: top-50 on chunk text
        2. FAISS: top-30 using embedding
        3. RRF: fuse lists → top-12
        4. Context set: take top-6 chunks (parameterized)
        """
        # Enhanced query for better retrieval
        enhanced_query = self._enhance_query(query)
        
        # Get top-50 from BM25
        bm25_results = self._bm25_retrieve(enhanced_query, k=50)
        
        # Get top-30 from FAISS
        faiss_results = await self._faiss_retrieve(enhanced_query, k=30)
        
        # Fuse using RRF to get top-12
        rrf_results = self._reciprocal_rank_fusion(bm25_results, faiss_results, max_results=12)
        
        # Filter for relevance and return top-k (default 6) chunks
        filtered_results = self._filter_relevant_chunks(query, rrf_results)
        return filtered_results[:max_results]
    
    def _bm25_retrieve(self, query: str, k: int) -> List[Tuple[int, float]]:
        query_tokens = re.findall(r'\b\w+\b', query.lower())
        scores = self.bm25_index.get_scores(query_tokens)
        top_indices = np.argsort(scores)[::-1][:k]
        
        return [(idx, scores[idx]) for idx in top_indices if scores[idx] > 0]
    
    async def _faiss_retrieve(self, query: str, k: int) -> List[Tuple[int, float]]:
        response = self.client.embeddings.create(
            model=Config.EMBEDDING_MODEL,
            input=[query]
        )
        
        query_embedding = np.array([response.data[0].embedding], dtype=np.float32)
        distances, indices = self.faiss_index.search(query_embedding, k)
        similarities = 1 / (1 + distances[0])
        
        return [(int(idx), float(sim)) for idx, sim in zip(indices[0], similarities)]
    
    def _reciprocal_rank_fusion(self, bm25_results: List[Tuple[int, float]], 
                               faiss_results: List[Tuple[int, float]], 
                               max_results: int, k: int = 60) -> List[Dict]:
        bm25_ranks = {idx: rank + 1 for rank, (idx, _) in enumerate(bm25_results)}
        faiss_ranks = {idx: rank + 1 for rank, (idx, _) in enumerate(faiss_results)}
        
        all_indices = set(bm25_ranks.keys()) | set(faiss_ranks.keys())
        rrf_scores = {}
        
        for idx in all_indices:
            score = 0
            if idx in bm25_ranks:
                score += 1 / (k + bm25_ranks[idx])
            if idx in faiss_ranks:
                score += 1 / (k + faiss_ranks[idx])
            rrf_scores[idx] = score
        
        sorted_indices = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
        top_indices = sorted_indices[:max_results]
        
        results = []
        for idx in top_indices:
            chunk = self.metadata[idx].copy()
            chunk["rrf_score"] = rrf_scores[idx]
            results.append(chunk)
        
        return results
    
    def _enhance_query(self, query: str) -> str:
        """Enhance query with relevant synonyms and terms."""
        query_lower = query.lower()
        
        # Map common terms to HR-specific vocabulary
        enhancements = {
            'vacation': 'vacation annual leave time off rest relaxation',
            'sick leave': 'sick leave illness medical health certificate',
            'maternity': 'maternity leave pregnancy birth adoptive',
            'performance': 'performance evaluation appraisal review management assessment',
            'benefits': 'benefits compensation salary reward package allowance',
            'termination': 'termination dismissal resignation cessation employment end',
            'working hours': 'working hours schedule time attendance shift',
            'disciplinary': 'disciplinary procedure misconduct relations employee',
            'probation': 'probation probationary period employment orientation new',
            'probationary': 'probation probationary period employment orientation new'
        }
        
        enhanced = query
        for term, expansion in enhancements.items():
            if term in query_lower:
                enhanced = f"{query} {expansion}"
                break
                
        return enhanced
    
    def _filter_relevant_chunks(self, original_query: str, chunks: List[Dict]) -> List[Dict]:
        """Filter out chunks that are clearly irrelevant to the query."""
        query_lower = original_query.lower()
        
        # Define relevance keywords for different query types
        relevance_map = {
            'vacation': ['leave', 'vacation', 'annual', 'time off', 'attendance', 'rest'],
            'sick': ['sick', 'illness', 'medical', 'health', 'leave', 'certificate'],
            'maternity': ['maternity', 'pregnancy', 'leave', 'birth', 'adoptive'],
            'performance': ['performance', 'evaluation', 'appraisal', 'review', 'management'],
            'benefits': ['benefits', 'compensation', 'salary', 'reward', 'package', 'allowance'],
            'termination': ['termination', 'dismissal', 'resignation', 'cessation', 'employment', 'end'],
            'working hours': ['hours', 'work', 'schedule', 'time', 'attendance', 'shift'],
            'disciplinary': ['disciplinary', 'misconduct', 'procedure', 'relations', 'employee'],
            'probation': ['probation', 'probationary', 'period', 'employment', 'orientation', 'new'],
            'offered': ['benefits', 'compensation', 'salary', 'reward', 'package']  # for "benefits offered"
        }
        
        # Find relevant keywords for this query
        relevant_keywords = []
        for key, keywords in relevance_map.items():
            if key in query_lower:
                relevant_keywords.extend(keywords)
                break
        
        if not relevant_keywords:
            return chunks  # No filtering if we can't determine relevance
        
        filtered_chunks = []
        for chunk in chunks:
            chunk_text = chunk.get('text', '').lower()
            chunk_headings = ' '.join(chunk.get('headings_path', [])).lower()
            
            # Check if chunk contains relevant keywords
            relevance_score = 0
            for keyword in relevant_keywords:
                if keyword in chunk_text:
                    relevance_score += 2  # Higher weight for text content
                elif keyword in chunk_headings:
                    relevance_score += 1  # Lower weight for headings
            
            # More strict filtering - require at least some relevance
            if relevance_score >= 2:  # Need at least 2 points
                filtered_chunks.append(chunk)
            elif relevance_score >= 1 and len(filtered_chunks) < 1:  # Allow 1 weak match if we have nothing
                filtered_chunks.append(chunk)
        
        return filtered_chunks if filtered_chunks else chunks[:6]  # Return up to 6 chunks as fallback
