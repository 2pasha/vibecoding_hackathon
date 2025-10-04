FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    tesseract-ocr \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY scripts/ ./scripts/
COPY app/ ./app/
COPY data/ ./data/

RUN mkdir -p /var/data/index

ENV PYTHONPATH=/app
ENV DATA_DIR=/opt/render/project/src/data
ENV INDEX_DIR=/var/data/index
ENV CHAT_MODEL=gpt-4o-mini
ENV EMBEDDING_MODEL=text-embedding-3-large

# Expose ports for API and UI
EXPOSE 8080 8501

# Copy startup script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Use startup script for local development (includes both API and UI)
CMD ["./docker-entrypoint.sh"]
