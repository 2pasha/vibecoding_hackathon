import os
import json
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware

from .config import Config
from .models import QueryRequest, QueryResponse, IngestRequest, IngestResponse, HealthResponse, TokenValidationRequest, TokenValidationResponse, TeamMember, TeamResponse, UserTokenValidationRequest, UserTokenValidationResponse, CourseGenerationRequest, CourseGenerationResponse, ChecklistGenerationRequest, ChecklistGenerationResponse
from .index_manager import IndexManager
from .response_generator import ResponseGenerator
from .notion_client import NotionClient
from .auth import verify_token, validate_api_token
from .logging_utils import log_query, log_ingestion_start, log_ingestion_end, log_error, hash_query
from .cache import response_cache


async def verify_user_token(authorization: str = Header(None)) -> dict:
    """Verify user token from Authorization header and return user data."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format. Use 'Bearer <token>'")

    token = authorization[7:]  # Remove "Bearer " prefix

    try:
        # Read team data from JSON file
        team_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "team.json")

        with open(team_file_path, 'r', encoding='utf-8') as f:
            team_data = json.load(f)

        # Find user by API token
        user = None
        for member in team_data:
            if member["api_token"] == token:
                user = member
                break

        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Return user data (excluding api_token for security)
        user_data = {k: v for k, v in user.items() if k != "api_token"}
        return user_data

    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Team data file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON in team data file")
    except HTTPException:
        # Re-raise HTTP exceptions (like 401)
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating user token: {str(e)}")


def create_app() -> FastAPI:
    Config.validate()
    
    app = FastAPI(
        title="HR Manual RAG API",
        description="Retrieval-Augmented Generation API for HR Policies and Procedures",
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
notion_client = NotionClient()


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
        
        # Check if this query is likely to be found in HR manual or should go to Notion
        notion_results = []
        should_try_notion = False
        
        # Define HR-related keywords that should stay in HR manual
        hr_keywords = [
            'vacation', 'leave', 'sick', 'maternity', 'paternity', 'benefits', 'salary', 'pay',
            'performance', 'review', 'appraisal', 'disciplinary', 'termination', 'resignation',
            'probation', 'onboarding', 'training', 'policy', 'procedure', 'employee', 'employment',
            'workplace', 'hours', 'overtime', 'holiday', 'attendance', 'absence', 'dress code',
            'code of conduct', 'harassment', 'discrimination', 'safety', 'health', 'insurance',
            'retirement', 'pension', 'bonus', 'incentive', 'promotion', 'career', 'development'
        ]
        
        query_lower = request.query.lower()
        
        # Check if query contains HR-related terms
        is_hr_related = any(keyword in query_lower for keyword in hr_keywords)
        
        if not chunks:
            should_try_notion = True
        elif not is_hr_related:
            # If query doesn't seem HR-related, try Notion first
            should_try_notion = True
        else:
            # For HR-related queries, check if chunks are actually relevant
            max_rrf_score = max(chunk.get("rrf_score", 0) for chunk in chunks)
            if max_rrf_score < 0.01:  # Very low relevance threshold
                should_try_notion = True
        
        if should_try_notion:
            print(f"DEBUG: Trying Notion fallback for query: {request.query}")
            notion_results = await notion_client.search(request.query, max_results=6)
            print(f"DEBUG: Notion search returned {len(notion_results)} results")
            # If we found Notion results, use them instead of HR chunks
            if notion_results:
                chunks = []
                print(f"DEBUG: Using Notion results, clearing HR chunks")
            else:
                print(f"DEBUG: No Notion results found, using HR chunks")
        
        answer, citations = await response_generator.generate_response(
            request.query, chunks, notion_results
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


@app.post("/validate-user-token")
async def validate_user_token(request: UserTokenValidationRequest):
    """Validate user ID token and return user data if valid."""
    try:
        # Read team data from JSON file
        team_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "team.json")
        
        with open(team_file_path, 'r', encoding='utf-8') as f:
            team_data = json.load(f)
        
        # Find user by ID token (api_token field)
        user = None
        for member in team_data:
            if member["api_token"] == request.token:
                user = member
                break
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid ID token")
        
        # Return user data (excluding api_token for security)
        user_data = {k: v for k, v in user.items() if k != "api_token"}
        
        return {
            "success": True,
            "message": "Token validated successfully",
            "user": user_data
        }
        
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Team data file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON in team data file")
    except HTTPException:
        # Re-raise HTTP exceptions (like 401)
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating user token: {str(e)}")


@app.get("/team")
async def get_team_members():
    """Get list of team members with API tokens for authentication."""
    try:
        # Read team data from JSON file
        team_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "team.json")
        
        with open(team_file_path, 'r', encoding='utf-8') as f:
            team_data = json.load(f)
        
        # Return full team data including api_token for frontend authentication
        return team_data
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Team data file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON in team data file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading team data: {str(e)}")


@app.post("/generate-course", response_model=CourseGenerationResponse)
async def generate_personalized_course(request: CourseGenerationRequest, user_data: dict = Depends(verify_user_token)):
    """Generate a personalized learning course based on user's current skills and learning goals."""
    try:
        # Build context for OpenAI based on user's current skills and position
        user_context = f"""
        User Profile:
        - Name: {user_data['name']}
        - Position: {user_data['position']}
        - Current Hard Skills: {', '.join(user_data['hard_skills'])}
        - Current Soft Skills: {', '.join(user_data['soft_skills'])}

        Learning Goal: {request.learning_goal}
        """

        # Generate personalized course using OpenAI
        course_content = await response_generator.generate_course(user_context, request.learning_goal)

        return CourseGenerationResponse(
            success=True,
            message="Course generated successfully",
            course_content=course_content
        )

    except Exception as e:
        log_error("generate_course", str(e))
        raise HTTPException(status_code=500, detail=f"Error generating course: {str(e)}")


@app.post("/generate-checklist", response_model=ChecklistGenerationResponse)
async def generate_checklist(request: ChecklistGenerationRequest, user_data: dict = Depends(verify_user_token)):
    """Generate a checklist of actionable items from a previously generated course."""
    try:
        # Generate checklist from the course content
        checklist = await response_generator.generate_checklist(request.generated_course)

        return ChecklistGenerationResponse(
            success=True,
            message="Checklist generated successfully",
            checklist=checklist
        )

    except Exception as e:
        log_error("generate_checklist", str(e))
        raise HTTPException(status_code=500, detail=f"Error generating checklist: {str(e)}")


@app.get("/")
async def root():
    return {
        "name": "HR Manual RAG API",
        "version": "1.0.0",
        "status": "healthy" if index_manager.indexes_loaded else "not_ready",
        "endpoints": {
            "POST /ask": "Query the HR manual (requires Bearer token)",
            "POST /ingest": "Rebuild indexes from PDF (requires Bearer token)",
            "POST /validate-token": "Validate API token",
            "POST /validate-user-token": "Validate user ID token and return user data",
            "POST /generate-course": "Generate personalized learning course (requires Bearer token)",
            "POST /generate-checklist": "Generate checklist from course content (requires Bearer token)",
            "GET /team": "Get list of team members",
            "GET /healthz": "Health check"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)