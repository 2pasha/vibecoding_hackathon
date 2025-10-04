#!/bin/bash

# HR Manual Chat - Development Start Script

set -e

echo "🚀 Starting HR Manual Chat Development Environment"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run ./setup-dev.sh first."
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "🐍 Starting backend API..."
source venv/bin/activate
python -m app.main &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "⚛️  Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo "✅ Services started!"
echo "   Backend: http://localhost:8080"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

wait $BACKEND_PID $FRONTEND_PID

