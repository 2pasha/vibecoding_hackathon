import os
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware

from .config import Config
from .models import QueryRequest, QueryResponse, IngestRequest, IngestResponse, HealthResponse, TokenValidationRequest, TokenValidationResponse
from .index_manager import IndexManager
from .response_generator import ResponseGenerator
from .auth import verify_token, validate_api_token
from .logging_utils import log_query, log_ingestion_start, log_ingestion_end, log_error, hash_query
from .cache import response_cache


def create_app() -> FastAPI:
    Config.validate()
    
    app = FastAPI(
        title="ETI HR Manual RAG API",
        description="Retrieval-Augmented Generation API for ETI HR Policies and Procedures",
        version="1.0.0"
    )
    
    # Enable CORS for development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app


app = create_app()
index_manager = IndexManager()
response_generator = ResponseGenerator()


@app.on_event("startup")
async def startup_event():
    index_manager.load_indexes()


@app.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest, _: bool = Depends(verify_token)):
    if not index_manager.indexes_loaded or not index_manager.retrieval_pipeline:
        raise HTTPException(status_code=503, detail="Indexes not loaded")
    
    start_time = time.time()
    query_hash = hash_query(request.query)
    
    # Check cache first
    cached_response = response_cache.get(request.query)
    if cached_response:
        # Return cached response with minimal latency (cache hit)
        cache_latency = int((time.time() - start_time) * 1000)
        cached_response_copy = cached_response.copy()
        cached_response_copy["latency_ms"] = max(cache_latency, 5)  # Minimum 5ms to show cache hit
        return QueryResponse(**cached_response_copy)
    
    try:
        # Use max_tokens to determine context size (default 6 chunks for 600 tokens)
        context_chunks = min(6, request.max_tokens // 100)  # Rough estimate
        
        chunks = await index_manager.retrieval_pipeline.retrieve(
            request.query, context_chunks
        )
        
        answer, citations = await response_generator.generate_response(
            request.query, chunks
        )
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        # Extract integer IDs, converting string IDs if necessary
        retrieved_ids = []
        for i, chunk in enumerate(chunks):
            chunk_index = chunk.get("chunk_index")
            if chunk_index is not None and isinstance(chunk_index, int):
                retrieved_ids.append(chunk_index)
            else:
                # Try to extract number from chunk_id like "chunk_0027" -> 27
                chunk_id = chunk.get("chunk_id", f"chunk_{i:04d}")
                if isinstance(chunk_id, str) and chunk_id.startswith("chunk_"):
                    try:
                        chunk_num = int(chunk_id.split("_")[1])
                        retrieved_ids.append(chunk_num)
                    except (IndexError, ValueError):
                        retrieved_ids.append(i)
                else:
                    retrieved_ids.append(i)
        
        # Log query processing
        response_data = {
            "answer": answer,
            "citations": citations,
            "retrieved_ids": retrieved_ids,
            "latency_ms": latency_ms
        }
        
        # Cache the response
        response_cache.put(request.query, response_data)
        
        log_query(query_hash, retrieved_ids, latency_ms, len(citations))
        
        return QueryResponse(**response_data)
        
    except Exception as e:
        log_error("ask_question", str(e))
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.post("/ingest", response_model=IngestResponse)
async def ingest_pdf(request: IngestRequest, _: bool = Depends(verify_token)):
    if not os.path.exists(request.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    try:
        log_ingestion_start(request.pdf_path)
        success = index_manager.run_ingestion(request.pdf_path)
        
        if success:
            chunk_count = len(index_manager.metadata) if index_manager.metadata else 0
            log_ingestion_end(chunk_count, True)
            return IngestResponse(status="ok")
        else:
            log_ingestion_end(0, False)
            raise HTTPException(status_code=500, detail="Ingestion failed")
            
    except Exception as e:
        log_error("ingest_pdf", str(e))
        log_ingestion_end(0, False)
        raise HTTPException(status_code=500, detail=f"Error during ingestion: {str(e)}")


@app.get("/healthz", response_model=HealthResponse)
async def health_check():
    return HealthResponse(ok=index_manager.indexes_loaded)


@app.post("/validate-token", response_model=TokenValidationResponse)
async def validate_token_endpoint(request: TokenValidationRequest):
    """Validate API token without requiring authentication."""
    if not Config.API_TOKEN:
        return TokenValidationResponse(
            valid=False, 
            message="API token not configured on server"
        )
    
    is_valid = validate_api_token(request.token)
    return TokenValidationResponse(
        valid=is_valid,
        message="Token is valid" if is_valid else "Invalid token"
    )


@app.get("/")
async def root():
    return {
        "name": "ETI HR Manual RAG API",
        "version": "1.0.0",
        "status": "healthy" if index_manager.indexes_loaded else "not_ready",
        "endpoints": {
            "POST /ask": "Query the HR manual (requires Bearer token)",
            "POST /ingest": "Rebuild indexes from PDF (requires Bearer token)",
            "POST /validate-token": "Validate API token",
            "GET /healthz": "Health check"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)