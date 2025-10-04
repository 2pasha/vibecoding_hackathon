#!/bin/bash

# ETI RAG System Docker Entrypoint

set -e

echo "🚀 Starting ETI RAG System..."

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

# Check if indexes exist, if not run ingestion
if [ ! -f "/var/data/index/metadata.json" ]; then
    echo "📚 No indexes found. Running initial ingestion..."
    
    # Use the brief-specified PDF path
    HR_MANUAL="/app/data/HR_Manual.pdf"
    
    if [ ! -f "$HR_MANUAL" ]; then
        echo "❌ Error: PDF not found at $HR_MANUAL"
        exit 1
    fi
    
    echo "📄 Processing: $HR_MANUAL"
    python /app/scripts/ingest.py --pdf "$HR_MANUAL" --output-dir /var/data/index
    
    if [ $? -eq 0 ]; then
        echo "✅ Ingestion completed successfully"
    else
        echo "❌ Ingestion failed"
        exit 1
    fi
else
    echo "✅ Indexes found, skipping ingestion"
fi

# Start the FastAPI service in the background
echo "🌐 Starting FastAPI service..."
cd /app
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 &

# Wait a bit for FastAPI to start
sleep 5

# Check if FastAPI is running
if curl -f http://localhost:8080/healthz > /dev/null 2>&1; then
    echo "✅ FastAPI service is running"
else
    echo "❌ FastAPI service failed to start"
    exit 1
fi

# Start Streamlit UI
echo "🎨 Starting Streamlit UI..."
streamlit run /app/app/ui.py --server.port 8501 --server.address 0.0.0.0 --server.headless true
