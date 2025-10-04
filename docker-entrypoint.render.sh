#!/bin/bash
set -e

echo "🚀 Starting ETI RAG System on Koyeb..."

# ==== Перевірка змінних ====
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is required"
    exit 1
fi

: "${DATA_DIR:=/var/data}"
: "${INDEX_DIR:=/var/data/index}"
: "${API_BASE_URL:=/api}"
: "${PORT:=7860}"  # для локалки

# ==== Інгестіон ====
if [ ! -f "$INDEX_DIR/metadata.json" ]; then
    echo "📚 No indexes found. Running initial ingestion..."
    HR_MANUAL="/app/data/ETI_HR_Manual.pdf"
    if [ ! -f "$HR_MANUAL" ]; then
        echo "❌ Error: PDF not found at $HR_MANUAL"
        exit 1
    fi
    echo "📄 Processing: $HR_MANUAL"
    python /app/scripts/ingest.py --pdf "$HR_MANUAL" --output-dir "$INDEX_DIR"
    echo "✅ Ingestion completed"
else
    echo "✅ Indexes found, skipping ingestion"
fi

# ==== Запуск FastAPI ====
echo "🌐 Starting FastAPI service on :8080..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 &
FASTAPI_PID=$!

# Чекаємо готовності
for i in {1..30}; do
    if curl -fsS http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
        echo "✅ FastAPI is up"
        break
    fi
    echo "⏳ Waiting for FastAPI..."
    sleep 1
done

# ==== Запуск Streamlit ====
echo "🎨 Starting Streamlit UI on :8501..."
streamlit run /app/app/ui.py \
  --server.port 8501 \
  --server.address 0.0.0.0 \
  --server.headless true &
STREAMLIT_PID=$!

# ==== Запуск Caddy ====
echo "🧭 Starting Caddy on :$PORT ..."
exec caddy run --config /app/Caddyfile --adapter caddyfile
