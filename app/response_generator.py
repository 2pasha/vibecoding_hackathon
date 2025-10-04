from typing import List, Dict, Tuple
from openai import OpenAI
from .config import Config


class ResponseGenerator:
    def __init__(self):
        self.client = OpenAI(
            api_key=Config.OPENAI_API_KEY, 
            timeout=10.0,  # Reduced timeout
            max_retries=1  # Fewer retries for speed
        )
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        return """You are an AI assistant that answers questions about ETI HR policies and procedures based strictly on the provided document chunks.

IMPORTANT INSTRUCTIONS:
1. Answer ONLY based on the information provided in the retrieved chunks
2. Format your response as:
   - Answer (concise, policy language)
   - How this is determined: [bullet list of citations]
3. If information is not available in the chunks, respond with: "Not specified in the retrieved sections." Then list closest sections with pages.
4. Include citations using EXACTLY this format: [ETI HR Manual — <Heading path ≤ 3 levels>, pp.<a>–<b>]
5. Note ETI precedence if relevant (Constitutive Instruments override local law)
6. Use the heading_path and page information from each chunk for citations
7. Be concise but comprehensive
8. Do not make assumptions or add information not in the chunks"""
    
    async def generate_response(self, query: str, chunks: List[Dict]) -> Tuple[str, List[str]]:
        if not chunks:
            return "Not specified in the retrieved sections.", []
        
        context_parts, citations = self._prepare_context(chunks)
        context = "\n".join(context_parts)
        
        answer = await self._generate_answer(query, context)
        used_citations = self._extract_citations(answer, citations)
        
        return answer, used_citations
    
    def _prepare_context(self, chunks: List[Dict]) -> Tuple[List[str], List[str]]:
        context_parts = []
        citations = []
        
        for i, chunk in enumerate(chunks):
            heading_path = chunk.get("headings_path", chunk.get("heading_path", "General"))
            if isinstance(heading_path, list):
                heading_path = " → ".join(heading_path[:3])  # Max 3 levels
            
            pages = chunk.get("pages", [chunk.get("page_start", 1), chunk.get("page_end", 1)])
            if isinstance(pages, list) and len(pages) >= 2:
                page_start, page_end = pages[0], pages[1]
            else:
                page_start = page_end = chunk.get("page_start", 1)
            
            page_info = f"p.{page_start}" if page_start == page_end else f"pp.{page_start}–{page_end}"
            citation = f"[ETI HR Manual — {heading_path}, {page_info}]"
            
            citations.append(citation)
            chunk_id = chunk.get("chunk_index", chunk.get("chunk_id", i))
            context_parts.append(f"<CHUNK id={chunk_id}>\n{chunk['text']}\n</CHUNK>\n")
        
        return context_parts, citations
    
    async def _generate_answer(self, query: str, context: str) -> str:
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Question: {query}\n\nContext:\n{context}\n\nAnswer:"}
        ]
        
        response = self.client.chat.completions.create(
            model=Config.CHAT_MODEL,
            messages=messages,
            temperature=0.1,  # Lower temperature for faster generation
            max_tokens=250,   # Further reduced for speed
            stream=False      # Ensure no streaming overhead
        )
        
        return response.choices[0].message.content.strip()
    
    def _extract_citations(self, answer: str, citations: List[str]) -> List[str]:
        import re
        
        # Extract citations that GPT actually generated in the answer
        citation_pattern = r'\[ETI HR Manual — ([^\]]+)\]'
        gpt_citations = re.findall(citation_pattern, answer)
        
        if gpt_citations:
            # Use the citations GPT generated
            formatted_citations = [f"[ETI HR Manual — {cite}]" for cite in gpt_citations]
            return list(set(formatted_citations))  # Remove duplicates
        else:
            # Fallback to metadata-based citations if no GPT citations found
            used_citations = []
            for citation in citations:
                if citation in answer or any(part in answer for part in citation.split("—")[1:]):
                    used_citations.append(citation)
            
            return used_citations if used_citations else list(set(citations))
