import json
import pickle
import re
from pathlib import Path
from typing import List, Dict, Tuple

import numpy as np
import faiss
from openai import OpenAI
from rank_bm25 import BM25Okapi


class IndexBuilder:
    def __init__(self, chunks: List[Dict], openai_api_key: str, embedding_model: str):
        self.chunks = chunks
        self.client = OpenAI(api_key=openai_api_key)
        self.embedding_model = embedding_model
        self.embeddings = None
        self.faiss_index = None
        self.bm25_index = None
    
    def build_bm25_index(self) -> BM25Okapi:
        print("Building BM25 index...")
        
        tokenized_chunks = []
        for chunk in self.chunks:
            tokens = re.findall(r'\b\w+\b', chunk["text"].lower())
            tokenized_chunks.append(tokens)
        
        self.bm25_index = BM25Okapi(tokenized_chunks)
        return self.bm25_index
    
    def build_faiss_index(self) -> Tuple[faiss.IndexHNSWFlat, np.ndarray]:
        print("Generating embeddings...")
        
        batch_size = 100
        all_embeddings = []
        
        for i in range(0, len(self.chunks), batch_size):
            batch_chunks = self.chunks[i:i + batch_size]
            batch_texts = [chunk["text"] for chunk in batch_chunks]
            
            response = self.client.embeddings.create(
                model=self.embedding_model,
                input=batch_texts
            )
            
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
            
            print(f"Generated embeddings for chunks {i+1}-{min(i+batch_size, len(self.chunks))}")
        
        self.embeddings = np.array(all_embeddings, dtype=np.float32)
        
        print("Building FAISS index...")
        
        dimension = self.embeddings.shape[1]
        self.faiss_index = faiss.IndexHNSWFlat(dimension, 32)
        self.faiss_index.hnsw.efConstruction = 200
        self.faiss_index.add(self.embeddings)
        
        return self.faiss_index, self.embeddings
    
    def save_indexes(self, output_dir: str):
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        print(f"Saving indexes to {output_path}...")
        
        # Save with brief-specified filenames
        with open(output_path / "meta_full.json", "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, indent=2, ensure_ascii=False)
        
        # Save BM25 corpus as JSONL format
        with open(output_path / "bm25_corpus.jsonl", "w", encoding="utf-8") as f:
            for chunk in self.chunks:
                corpus_entry = {
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                    "doc_id": chunk["doc_id"]
                }
                f.write(json.dumps(corpus_entry, ensure_ascii=False) + "\n")
        
        # Save BM25 index for loading
        with open(output_path / "bm25_index.pkl", "wb") as f:
            pickle.dump(self.bm25_index, f)
        
        # Brief specifies faiss.index filename
        faiss.write_index(self.faiss_index, str(output_path / "faiss.index"))
        np.save(output_path / "embeddings.npy", self.embeddings)
        
        # Keep legacy files for backward compatibility
        with open(output_path / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, indent=2, ensure_ascii=False)
        faiss.write_index(self.faiss_index, str(output_path / "faiss_index.index"))
        
        print("Indexes saved successfully!")
