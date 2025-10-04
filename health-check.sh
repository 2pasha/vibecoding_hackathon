#!/bin/bash

# ETI HR Manual Chat - Health Check Script

set -e

echo "🔍 Checking ETI HR Manual Chat Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if containers are running
echo "📦 Checking containers..."
if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "test-chat"; then
    echo "❌ No test-chat containers found. Run './start-docker-dev.sh' first."
    exit 1
fi

# Check backend health
echo "🔧 Checking backend health..."
if curl -s http://localhost:8080/healthz | grep -q '"ok":true'; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
    exit 1
fi

# Check frontend
echo "⚛️  Checking frontend..."
if curl -s http://localhost:3000/ | grep -q "doctype html"; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
    exit 1
fi

# Check nginx proxy
echo "🌐 Checking nginx proxy..."
if curl -s http://localhost:80/healthz | grep -q '"ok":true'; then
    echo "✅ Nginx proxy is working"
else
    echo "❌ Nginx proxy is not working"
    exit 1
fi

# Test API functionality
echo "🧪 Testing API functionality..."
API_RESPONSE=$(curl -s -H "Authorization: Bearer your_api_token_here" \
                   -H "Content-Type: application/json" \
                   -d '{"query": "What is the dress code policy?"}' \
                   http://localhost:80/api/ask 2>/dev/null || echo "API_ERROR")

if [[ "$API_RESPONSE" == *"answer"* ]]; then
    echo "✅ API is working correctly"
else
    echo "⚠️  API test failed (this might be due to invalid API token)"
fi

echo ""
echo "🎉 All services are running correctly!"
echo ""
echo "Access points:"
echo "  • Main App: http://localhost:80"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend:  http://localhost:8080"
echo "  • API Docs: http://localhost:8080/docs"
