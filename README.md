# Cheatix Team Assistance

A comprehensive AI-powered team productivity platform featuring HR knowledge management, personalized skill development, and team collaboration tools. Built with FastAPI backend and React frontend.

## 🚀 Features

### 📚 Knowledge QA
- **RAG-powered HR Manual Search**: Query company policies and procedures using hybrid search (BM25 + FAISS)
- **Intelligent Citations**: Accurate source references with page numbers
- **Real-time Chat Interface**: Modern, responsive chat UI with message history
- **Example Questions**: Pre-built queries to help users get started

### 🔧 SkillSmith
- **Personal Development Plans (PDP)**: AI-generated personalized skill development programs
- **User-Specific Recommendations**: Based on individual skills, position, and goals
- **Progressive Loading States**: Engaging user experience with humorous loading messages
- **HTML-Rich Content**: Comprehensive PDPs with structured learning paths

### 🧠 Team Memory Agent
- **Coming Soon**: Advanced team collaboration and memory management features
- **Future Integration**: Planned features for team knowledge sharing and project management

## 🏗️ Architecture

### Backend (FastAPI)
- **Hybrid Search Engine**: BM25 (keyword) + FAISS (semantic) with Reciprocal Rank Fusion
- **AI Response Generation**: GPT-4o-mini for intelligent content creation
- **User Authentication**: Token-based authentication with team member management
- **RESTful API**: Clean, documented endpoints with automatic OpenAPI docs

### Frontend (React + TypeScript)
- **Modern UI**: Tailwind CSS with responsive design
- **State Management**: React Context API with comprehensive state handling
- **Tab-based Navigation**: Clean, intuitive user interface
- **Real-time Updates**: Dynamic content updates and loading states

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **OpenAI GPT-4o-mini**: AI language model for content generation
- **FAISS**: Vector similarity search
- **BM25**: Keyword-based search
- **PyMuPDF**: PDF processing
- **Pydantic**: Data validation and serialization

### Frontend
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API communication
- **Lucide React**: Beautiful icon library

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenAI API key
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd test-chat
cp env.template .env
```

### 2. Configure Environment
Edit `.env` file with your credentials:
```bash
OPENAI_API_KEY=your_openai_api_key_here
API_TOKEN=your_api_token_here
```

### 3. Start Development Environment
```bash
chmod +x start-docker-dev.sh
./start-docker-dev.sh
```

### 4. Access the Application
- **Main App**: http://localhost:80
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs

## 📁 Project Structure

```
test-chat/
├── app/                          # FastAPI backend
│   ├── main.py                   # Main application and API endpoints
│   ├── models.py                 # Pydantic data models
│   ├── auth.py                   # Authentication logic
│   ├── response_generator.py     # AI response generation
│   ├── retrieval.py              # Hybrid search implementation
│   ├── index_manager.py          # Index management
│   └── config.py                 # Configuration management
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── KnowledgeQA.tsx   # HR manual chat interface
│   │   │   ├── SkillSmith.tsx    # PDP generation interface
│   │   │   ├── TeamMemoryAgent.tsx # Team collaboration (coming soon)
│   │   │   └── TabNavigation.tsx # Navigation component
│   │   ├── contexts/             # React context providers
│   │   ├── services/              # API client
│   │   └── types/                 # TypeScript type definitions
│   └── package.json              # Frontend dependencies
├── scripts/                      # Data processing scripts
│   ├── ingest.py                 # PDF ingestion and indexing
│   ├── pdf_processor.py          # PDF text extraction
│   ├── text_chunker.py           # Text chunking logic
│   └── index_builder.py          # Index creation
├── data/                         # Data directory
│   ├── HR_Manual.pdf             # Source HR manual
│   ├── team.json                 # Team member data
│   └── index/                    # Generated search indexes
├── docker-compose.yml            # Docker configuration
├── requirements.txt               # Python dependencies
└── README.md                     # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | Required | OpenAI API key for AI features |
| `API_TOKEN` | Optional | Bearer token for API security |
| `CHAT_MODEL` | `gpt-4o-mini` | OpenAI chat completion model |
| `EMBEDDING_MODEL` | `text-embedding-3-large` | OpenAI embedding model |
| `DATA_DIR` | `/var/data` | Data storage directory |
| `INDEX_DIR` | `/var/data/index` | Index storage directory |

### Team Configuration
Team members are configured in `data/team.json` with:
- Personal information (name, position, birth date)
- Skills (hard skills and soft skills)
- Authentication tokens
- Notion workspace URLs

## 📡 API Endpoints

### Authentication
- `POST /validate-user-token` - Validate user ID token and return user data
- `GET /team` - Get team member information

### Knowledge QA
- `POST /ask` - Query HR manual with hybrid search
- `GET /healthz` - Health check endpoint

### SkillSmith
- `POST /generate-course` - Generate personalized development plan

### Data Management
- `POST /ingest` - Rebuild indexes from PDF file

## 🎯 Usage Examples

### Knowledge QA
Ask questions about company policies:
- "What is the vacation policy?"
- "How do I request time off?"
- "What are the working hours?"
- "What is the dress code policy?"

### SkillSmith
Generate personalized development plans:
- "I want to improve my technical skills"
- "Help me develop leadership capabilities"
- "Create a plan for career advancement"

## 🔐 Authentication

The system uses token-based authentication:
1. Users authenticate with their ID token
2. Tokens are validated against `team.json`
3. User data is loaded and displayed in the UI
4. All API requests include the token in the Authorization header

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production
```bash
docker-compose up --build
```

### Custom Configuration
Multiple Docker Compose files available:
- `docker-compose.dev.yml` - Development environment
- `docker-compose.full.yml` - Full production setup
- `docker-compose.render.yml` - Render.com deployment

## 🔍 Technical Details

### Search Implementation
1. **BM25 Retrieval**: Keyword-based search using Okapi BM25
2. **FAISS Retrieval**: Semantic search using HNSW index
3. **Reciprocal Rank Fusion**: Merges results with RRF score calculation
4. **Citation Generation**: Automatic source references with page numbers

### AI Integration
- **GPT-4o-mini**: Used for both HR Q&A and PDP generation
- **Temperature**: 0.1 for consistent, factual responses
- **Context Management**: User-specific context for personalized content
- **Response Validation**: Structured output with error handling

### Data Processing
- **PDF Processing**: PyMuPDF for text extraction
- **Chunking**: 800-1200 token chunks with 100 token overlap
- **Metadata Preservation**: Headings, page numbers, and structure
- **Index Management**: Automatic index loading and caching

## 🚀 Development

### Backend Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Data Ingestion
```bash
python scripts/ingest.py --pdf data/HR_Manual.pdf
```

## 📊 Performance

- **Search Latency**: < 1 second for most queries
- **AI Generation**: 5-15 seconds for PDP generation
- **Concurrent Users**: Supports multiple simultaneous users
- **Caching**: Response caching for improved performance

## 🔒 Security

- **Token Authentication**: Secure user authentication
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Pydantic models for request validation
- **Error Handling**: Comprehensive error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software developed for internal team use.

## 🆘 Support

For technical support or questions:
- Check the API documentation at `/docs`
- Review the health check at `/healthz`
- Examine logs for debugging information

---

**Cheatix Team Assistance** - Empowering teams with AI-driven productivity tools.