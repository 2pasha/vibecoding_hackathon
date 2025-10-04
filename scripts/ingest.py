#!/usr/bin/env python3
"""
Data ingestion script for ETI RAG system.
Parses HR manual PDF, chunks it, and creates BM25 corpus and FAISS index.
"""

import os
import argparse
from dotenv import load_dotenv

from pdf_processor import PDFProcessor
from text_chunker import TextChunker
from index_builder import IndexBuilder

load_dotenv()


def main():
    parser = argparse.ArgumentParser(description="Ingest PDF and build indexes")
    parser.add_argument("--pdf", required=True, help="Path to PDF file")
    parser.add_argument("--output-dir", default=os.getenv("INDEX_DIR", "/var/data/index"), 
                       help="Output directory for indexes")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.pdf):
        print(f"Error: PDF file not found at {args.pdf}")
        return 1
    
    print(f"Processing PDF: {args.pdf}")
    
    processor = PDFProcessor(args.pdf)
    pages_data = processor.extract_text_with_structure()
    print(f"Extracted text from {len(pages_data)} pages")
    
    chunker = TextChunker()
    chunks = chunker.chunk_pages(pages_data)
    print(f"Created {len(chunks)} chunks")
    
    token_counts = [chunk["token_count"] for chunk in chunks]
    print(f"Chunk token statistics:")
    print(f"  Min: {min(token_counts)}")
    print(f"  Max: {max(token_counts)}")
    print(f"  Avg: {sum(token_counts) / len(token_counts):.1f}")
    
    builder = IndexBuilder(
        chunks, 
        os.getenv("OPENAI_API_KEY"),
        os.getenv("EMBEDDING_MODEL", "text-embedding-3-large")
    )
    
    builder.build_bm25_index()
    builder.build_faiss_index()
    builder.save_indexes(args.output_dir)
    
    print("Ingestion completed successfully!")
    return 0


if __name__ == "__main__":
    exit(main())