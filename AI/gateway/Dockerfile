# Build from AI/: docker build -f gateway/Dockerfile .
FROM python:3.12-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY gateway/app ./app
COPY templates ./templates
ENV AI_TEMPLATES_DIR=/app/templates
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
