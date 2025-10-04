#!/bin/bash

# ETI RAG System Backend Docker Entrypoint

set -e

echo "🚀 Starting ETI RAG Backend..."

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

# Check if indexes exist, if not run ingestion
if [ ! -f "/var/data/index/metadata.json" ]; then
    echo "📚 No indexes found. Running initial ingestion..."
    
    # Use the brief-specified PDF path
    HR_MANUAL="/app/data/ETI_HR_Manual.pdf"
    
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

# Start the FastAPI service
echo "🌐 Starting FastAPI service..."
cd /app
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080
