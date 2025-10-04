from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import Config

security = HTTPBearer(auto_error=False)

def validate_api_token(token: str) -> bool:
    """Validate if provided token matches the configured API token."""
    return token == Config.API_TOKEN

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Bearer token for protected endpoints."""    
    if not credentials:
        raise HTTPException(
            status_code=401, 
            detail="Authorization header required"
        )
    
    if not validate_api_token(credentials.credentials):
        raise HTTPException(
            status_code=401, 
            detail="Invalid token"
        )
    
    return True
