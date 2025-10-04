#!/bin/bash

# Render startup script for ETI RAG System

set -e

echo "🚀 Starting ETI RAG System on Render..."

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

# Check if indexes exist, if not run ingestion
if [ ! -f "/var/data/index/meta_full.json" ] && [ ! -f "/var/data/index/metadata.json" ]; then
    echo "📚 No indexes found. Running initial ingestion..."
    
    # Find the HR manual PDF
    HR_MANUAL=$(find /app/data -name "*.pdf" | head -1)
    
    if [ -z "$HR_MANUAL" ]; then
        echo "❌ Error: No PDF found in data directory"
        exit 1
    fi
    
    echo "📄 Processing: $HR_MANUAL"
    python /app/scripts/ingest.py --pdf-path "$HR_MANUAL" --output-dir /var/data/index
    
    if [ $? -eq 0 ]; then
        echo "✅ Ingestion completed successfully"
    else
        echo "❌ Ingestion failed"
        exit 1
    fi
else
    echo "✅ Indexes found, skipping ingestion"
fi

echo "🌐 Starting Gunicorn server..."

# Start with Gunicorn as specified in brief
exec gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8080 app.main:app
