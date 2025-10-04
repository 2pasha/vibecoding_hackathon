from typing import List, Optional
from pydantic import BaseModel


class QueryRequest(BaseModel):
    query: str
    max_tokens: int = 600


class QueryResponse(BaseModel):
    answer: str
    citations: List[str]
    retrieved_ids: List[int]
    latency_ms: int


class IngestRequest(BaseModel):
    pdf_path: str


class IngestResponse(BaseModel):
    status: str


class HealthResponse(BaseModel):
    ok: bool


class TokenValidationRequest(BaseModel):
    token: str


class TokenValidationResponse(BaseModel):
    valid: bool
    message: str


class TeamMember(BaseModel):
    name: str
    birth_date: str
    position: str
    photo_url: str


class TeamResponse(BaseModel):
    members: List[TeamMember]
