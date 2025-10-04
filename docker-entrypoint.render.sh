#!/bin/bash

# HR Manual RAG System - Render Production Entrypoint

set -e

echo "🚀 Starting HR Manual RAG System on Render..."

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

# Set the port from Render's PORT environment variable
PORT=${PORT:-10000}
echo "🌐 Using port: $PORT"

# Update nginx configuration to use the correct port
sed -i "s/listen 10000;/listen $PORT;/" /etc/nginx/sites-available/default

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
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080 &
FASTAPI_PID=$!

# Wait a bit for FastAPI to start
sleep 10

# Check if FastAPI is running
if curl -f http://127.0.0.1:8080/healthz > /dev/null 2>&1; then
    echo "✅ FastAPI service is running"
else
    echo "❌ FastAPI service failed to start"
    exit 1
fi

# Start nginx in the foreground
echo "🌐 Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $FASTAPI_PID $NGINX_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for any process to exit
wait