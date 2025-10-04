import json
import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import Config

security = HTTPBearer(auto_error=False)

def validate_api_token(token: str) -> bool:
    """Validate if provided token matches the configured API token."""
    return token == Config.API_TOKEN

def validate_user_token(token: str) -> bool:
    """Validate if provided token matches any user's API token from team.json."""
    try:
        # Read team data from JSON file
        team_file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "team.json")
        
        with open(team_file_path, 'r', encoding='utf-8') as f:
            team_data = json.load(f)
        
        # Check if token matches any user's API token
        for member in team_data:
            if member["api_token"] == token:
                return True
        
        return False
        
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return False

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Bearer token for protected endpoints using user API tokens."""    
    if not credentials:
        raise HTTPException(
            status_code=401, 
            detail="Authorization header required"
        )
    
    if not validate_user_token(credentials.credentials):
        raise HTTPException(
            status_code=401, 
            detail="Invalid token"
        )
    
    return True
