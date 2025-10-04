# ETI HR Manual RAG System

A Retrieval-Augmented Generation (RAG) system for querying the ETI HR Policies and Procedures manual. This system uses hybrid search (BM25 + FAISS) and GPT-4o-mini to provide accurate answers with proper citations.

## 🚀 Quick Start for Developers

**For development with Docker (recommended):**
```bash
# 1. Clone and setup
git clone <repository-url>
cd test-chat

# 2. Configure environment
cp env.template .env
# Edit .env with your OPENAI_API_KEY and API_TOKEN

# 3. Start development environment
chmod +x start-docker-dev.sh
./start-docker-dev.sh
```

**Access the application:**
- Main App: http://localhost:80
- Frontend: http://localhost:3000  
- Backend API: http://localhost:8080
- API Docs: http://localhost:8080/docs

📖 **For detailed setup instructions, see [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md)**

## Architecture

- **Data Ingestion**: PDF parsing, chunking (800-1200 tokens), and indexing
- **Hybrid Retrieval**: BM25 (keyword) + FAISS (semantic) with Reciprocal Rank Fusion
- **Response Generation**: GPT-4o-mini with strict citation formatting
- **API**: FastAPI service with REST endpoints
- **UI**: Simple Streamlit chat interface

## Project Structure

```
test-chat/
├── scripts/                  # Data processing modules
│   ├── ingest.py            # Main ingestion script
│   ├── pdf_processor.py     # PDF text extraction
│   ├── text_chunker.py      # Text chunking logic
│   └── index_builder.py     # Index creation
├── app/                     # FastAPI application
│   ├── __init__.py         # Package initialization
│   ├── main.py             # FastAPI endpoints
│   ├── config.py           # Configuration management
│   ├── models.py           # Pydantic data models
│   ├── retrieval.py        # Hybrid search pipeline
│   ├── response_generator.py # GPT response generation
│   ├── index_manager.py    # Index loading/management
│   └── ui.py               # Streamlit chat interface
├── data/                    # Local data directory
│   ├── .gitkeep            # Keep directory in Git
│   └── index/
│       └── .gitkeep        # Keep index directory in Git
├── var/data/index/          # Docker data directory
│   └── .gitkeep            # Keep Docker directory in Git
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Docker Compose setup
├── .dockerignore           # Docker build exclusions
├── .gitignore              # Git exclusions
├── env.template           # Environment variables template
└── README.md              # This file
```

## Quick Start

### Option 1: Docker (Recommended)

1. **Clone and setup**:

   ```bash
   cd test-chat
   cp env.template .env
   # Edit .env and add your OpenAI API key
   ```

2. **Run with Docker Compose**:

   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Chat UI: http://localhost:8501
   - API docs: http://localhost:8080/docs
   - Health check: http://localhost:8080/healthz

### Option 2: Local Development

1. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**:

   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   export DATA_DIR="./data"
   export INDEX_DIR="./data/index"
   ```

3. **Run data ingestion** (as specified in brief):

   ```bash
   python scripts/ingest.py --pdf data/ETI_HR_Manual.pdf
   ```

4. **Start the API service**:

   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
   ```

5. **Start the UI** (in another terminal):
   ```bash
   streamlit run app/ui.py --server.port 8501
   ```

## 🔧 Configuration

### Environment Variables

| Variable          | Default                  | Description                   |
| ----------------- | ------------------------ | ----------------------------- |
| `OPENAI_API_KEY`  | Required                 | OpenAI API key                |
| `API_TOKEN`       | Optional                 | Bearer token for API security |
| `CHAT_MODEL`      | `gpt-4o-mini`            | Chat completion model         |
| `EMBEDDING_MODEL` | `text-embedding-3-large` | Embedding model               |
| `DATA_DIR`        | `/var/data`              | Data storage directory        |
| `INDEX_DIR`       | `/var/data/index`        | Index storage directory       |

### Chunking Parameters

- **Token Range**: 800-1200 tokens per chunk
- **Overlap**: 100 tokens between chunks
- **Splitting**: Heading-based with page number tracking

## API Endpoints

### POST /ask

Query the HR manual.

**Request**:

```json
{
  "query": "What is the vacation policy?",
  "max_tokens": 600
}
```

**Headers** (if API_TOKEN is configured):

```
Authorization: Bearer your_api_token_here
```

**Response**:

```json
{
  "answer": "According to the ETI HR manual...",
  "citations": [
    "[ETI HR Manual — Employee Benefits → Vacation Policy, pp.15–16]"
  ],
  "retrieved_ids": ["chunk_0042", "chunk_0043"],
  "latency_ms": 1250
}
```

### POST /ingest

Rebuild indexes from a PDF file.

**Request**:

```json
{
  "pdf_path": "/path/to/manual.pdf"
}
```

### GET /healthz

Health check endpoint.

**Response**:

```json
{
  "ok": true
}
```

## Example Queries

Try these example questions:

- "What is the vacation policy?"
- "How do I request time off?"
- "What are the working hours?"
- "What is the dress code policy?"
- "How is performance evaluated?"
- "What benefits are offered to employees?"
- "What is the remote work policy?"
- "How do I report workplace issues?"

## Citation Format

All answers include citations in this exact format:

```
[ETI HR Manual — <Heading path ≤ 3 levels>, pp.<a>–<b>]
```

Examples:

- `[ETI HR Manual — Employee Benefits, p.15]`
- `[ETI HR Manual — Policies → Time Off → Vacation, pp.12–14]`

If information is not found, the system responds:

```
"Not specified in the retrieved sections."
```

## 🔍 Technical Details

### Retrieval Pipeline

1. **BM25 Retrieval**: Keyword-based search using Okapi BM25
2. **FAISS Retrieval**: Semantic search using HNSW index
3. **Reciprocal Rank Fusion**: Merges results with RRF score calculation

### Response Generation

- Uses GPT-4o-mini for answer generation
- Strict prompt engineering for citation compliance
- Answers based solely on retrieved chunks
- Temperature: 0.1 for consistency

### Data Processing

- PDF text extraction with PyMuPDF
- Heading detection based on font size/formatting
- Token counting with tiktoken (cl100k_base encoding)
- Metadata preservation (headings, page numbers)
