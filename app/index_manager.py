import json
import pickle
import subprocess
from pathlib import Path
from typing import List, Dict, Optional

import numpy as np
import faiss
from rank_bm25 import BM25Okapi

from .config import Config
from .retrieval import RetrievalPipeline


class IndexManager:
    def __init__(self):
        self.metadata: List[Dict] = []
        self.bm25_index: Optional[BM25Okapi] = None
        self.faiss_index: Optional[faiss.IndexHNSWFlat] = None
        self.embeddings: Optional[np.ndarray] = None
        self.retrieval_pipeline: Optional[RetrievalPipeline] = None
        self.indexes_loaded = False
    
    def load_indexes(self) -> bool:
        index_path = Path(Config.INDEX_DIR)
        
        if not index_path.exists():
            print(f"Index directory not found: {Config.INDEX_DIR}")
            return False
        
        try:
            self._load_metadata(index_path)
            self._load_bm25_index(index_path)
            self._load_faiss_index(index_path)
            self._load_embeddings(index_path)
            
            self.retrieval_pipeline = RetrievalPipeline(
                self.metadata, self.bm25_index, self.faiss_index, self.embeddings
            )
            
            self.indexes_loaded = True
            print(f"Loaded indexes with {len(self.metadata)} chunks")
            return True
            
        except Exception as e:
            print(f"Error loading indexes: {e}")
            return False
    
    def _load_metadata(self, index_path: Path):
        with open(index_path / "metadata.json", "r", encoding="utf-8") as f:
            self.metadata = json.load(f)
    
    def _load_bm25_index(self, index_path: Path):
        with open(index_path / "bm25_index.pkl", "rb") as f:
            self.bm25_index = pickle.load(f)
    
    def _load_faiss_index(self, index_path: Path):
        self.faiss_index = faiss.read_index(str(index_path / "faiss_index.index"))
    
    def _load_embeddings(self, index_path: Path):
        self.embeddings = np.load(index_path / "embeddings.npy")
    
    def run_ingestion(self, pdf_path: str) -> bool:
        try:
            result = subprocess.run([
                "python", "scripts/ingest.py",
                "--pdf", pdf_path,
                "--output-dir", Config.INDEX_DIR
            ], capture_output=True, text=True, check=True)
            
            print("Ingestion completed:", result.stdout)
            self.load_indexes()
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"Ingestion failed: {e.stderr}")
            return False
