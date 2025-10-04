import logging
import sys
from datetime import datetime
from typing import List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("eti_rag")

def log_query(query_hash: str, retrieved_ids: List[int], latency_ms: int, citations_count: int):
    """Log query processing details without exposing full query text."""
    logger.info(
        f"QUERY_PROCESSED query_hash={query_hash} "
        f"retrieved_chunks={len(retrieved_ids)} "
        f"latency_ms={latency_ms} "
        f"citations={citations_count}"
    )

def log_ingestion_start(pdf_path: str):
    """Log ingestion start."""
    logger.info(f"INGEST_START pdf_path={pdf_path}")

def log_ingestion_end(chunk_count: int, success: bool):
    """Log ingestion completion."""
    status = "SUCCESS" if success else "FAILED"
    logger.info(f"INGEST_END chunks_created={chunk_count} status={status}")

def log_error(operation: str, error: str):
    """Log errors without sensitive information."""
    logger.error(f"ERROR operation={operation} error={error}")

def hash_query(query: str) -> str:
    """Create a hash of the query for logging without exposing content."""
    import hashlib
    return hashlib.sha256(query.encode()).hexdigest()[:8]
