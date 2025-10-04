#!/bin/bash

# HR Manual Chat - Development Setup Script

set -e

echo "🚀 Setting up HR Manual Chat Development Environment"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.template .env
    echo "📝 Please edit .env file with your configuration before continuing."
    echo "   Required: OPENAI_API_KEY, API_TOKEN"
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "1. Backend: source venv/bin/activate && python -m app.main"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Or use the start script: ./start-dev.sh"

