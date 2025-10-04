# HR Manual Chat - Developer Guide

## Overview
This project is a Retrieval-Augmented Generation (RAG) system for HR Manual, built with:
- **Backend**: FastAPI (Python) with OpenAI integration
- **Frontend**: React + TypeScript with Vite
- **Infrastructure**: Docker Compose for development environment

## Prerequisites
- Docker and Docker Compose installed
- OpenAI API key
- Git

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd test-chat
```

### 2. Environment Configuration
```bash
# Copy environment template
cp env.template .env

# Edit .env file with your configuration
# Required variables:
# - OPENAI_API_KEY=your_openai_api_key_here
# - API_TOKEN=your_api_token_here
```

### 3. Start Development Environment
```bash
# Make script executable and run
chmod +x start-docker-dev.sh
./start-docker-dev.sh
```

## Access Points

Once running, you can access:

- **Main Application**: http://localhost:80 (via nginx reverse proxy)
- **Frontend Direct**: http://localhost:3000 (React dev server with hot reload)
- **Backend Direct**: http://localhost:8080 (FastAPI server)
- **API Documentation**: http://localhost:8080/docs (FastAPI auto-generated docs)
- **Health Check**: http://localhost:80/healthz

## Docker Services

The development environment includes 3 containers:

### Backend (`test-chat-backend-1`)
- **Port**: 8080
- **Purpose**: FastAPI server with RAG functionality
- **Features**: 
  - Automatic index loading (115 chunks from HR manual)
  - OpenAI API integration
  - Response caching
  - Health checks

### Frontend (`test-chat-frontend-1`)
- **Port**: 3000
- **Purpose**: React development server
- **Features**:
  - Hot reload enabled
  - TypeScript support
  - Tailwind CSS
  - Connected to backend via Docker network

### Nginx (`test-chat-nginx-1`)
- **Port**: 80
- **Purpose**: Reverse proxy
- **Features**:
  - Routes frontend requests to React container
  - Routes API requests to backend container
  - WebSocket support for Vite HMR

## Development Commands

### Start Services
```bash
./start-docker-dev.sh
```

### Stop Services
```bash
docker-compose -f docker-compose.dev.yml down
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f nginx
```

### Rebuild Services
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Access Container Shell
```bash
# Backend container
docker-compose -f docker-compose.dev.yml exec backend bash

# Frontend container
docker-compose -f docker-compose.dev.yml exec frontend sh
```

## Project Structure

```
test-chat/
├── app/                    # Backend FastAPI application
│   ├── main.py            # Main FastAPI app
│   ├── config.py          # Configuration management
│   ├── index_manager.py   # Index loading and management
│   ├── response_generator.py # OpenAI response generation
│   └── ...
├── frontend/              # React frontend
│   ├── src/               # Source code
│   ├── Dockerfile.dev     # Development Dockerfile
│   └── ...
├── data/                  # Data directory
│   ├── ETI_HR_Manual.pdf  # Source PDF
│   └── index/             # Generated indexes
├── docker-compose.dev.yml # Development Docker Compose
├── Dockerfile.backend     # Backend Dockerfile
├── docker-entrypoint.backend.sh # Backend startup script
├── nginx.conf             # Nginx configuration
└── start-docker-dev.sh    # Development startup script
```

## Environment Variables

### Required
- `OPENAI_API_KEY`: Your OpenAI API key
- `API_TOKEN`: Authentication token for API access

### Optional
- `CHAT_MODEL`: OpenAI chat model (default: gpt-4o-mini)
- `EMBEDDING_MODEL`: OpenAI embedding model (default: text-embedding-3-large)
- `DATA_DIR`: Data directory path (default: /var/data)
- `INDEX_DIR`: Index directory path (default: /var/data/index)

## Troubleshooting

### Port Conflicts
If ports are already in use:
```bash
# Kill processes on specific ports
lsof -ti:80 | xargs kill -9
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

### Container Issues
```bash
# Remove all containers and start fresh
docker-compose -f docker-compose.dev.yml down
docker system prune -f
./start-docker-dev.sh
```

### Index Loading Issues
The backend automatically loads indexes from `/var/data/index`. If indexes don't exist, the system will:
1. Process the PDF file (`data/ETI_HR_Manual.pdf`)
2. Generate embeddings and BM25 indexes
3. Start the API server

### Frontend Not Connecting to Backend
- Check that both containers are running: `docker ps`
- Verify nginx is routing correctly: `curl http://localhost:80/healthz`
- Check frontend logs: `docker-compose -f docker-compose.dev.yml logs frontend`

## Development Workflow

1. **Code Changes**: Edit files in your IDE
2. **Frontend**: Changes are automatically reflected via hot reload
3. **Backend**: Restart backend container for changes:
   ```bash
   docker-compose -f docker-compose.dev.yml restart backend
   ```

## Production Deployment

For production deployment, use the existing `docker-compose.yml` which includes:
- Production-optimized builds
- Streamlit UI instead of React frontend
- Health checks and restart policies

## API Usage

### Authentication
All API endpoints (except `/healthz` and `/validate-token`) require authentication:
```bash
curl -H "Authorization: Bearer your_api_token" \
     -H "Content-Type: application/json" \
     -d '{"query": "What is the dress code policy?"}' \
     http://localhost:80/api/ask
```

### Available Endpoints
- `POST /ask`: Query the HR manual
- `POST /ingest`: Rebuild indexes from PDF
- `POST /validate-token`: Validate API token
- `GET /healthz`: Health check
- `GET /`: API information

## Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.dev.yml logs -f`
2. Verify environment variables in `.env`
3. Ensure Docker is running and ports are available
4. Check that OpenAI API key is valid and has sufficient credits
