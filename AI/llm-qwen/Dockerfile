# LLM #2 — Qwen2.5-0.5B Q4_0 (~428MB). Render Root Directory: AI
FROM alpine:3.20 AS model
RUN apk add --no-cache curl
RUN mkdir -p /models \
 && curl -fsSL -o /models/model.gguf \
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_0.gguf"

FROM --platform=linux/amd64 ghcr.io/ggml-org/llama.cpp:server
COPY --from=model /models/model.gguf /models/model.gguf
COPY shared/start-llama.sh /start-llama.sh
RUN chmod +x /start-llama.sh
WORKDIR /app
ENV LLAMA_MODEL_PATH=/models/model.gguf
ENV LLAMA_CTX=256
ENV LLAMA_THREADS=2
ENV LLAMA_BATCH=128
EXPOSE 8080
ENTRYPOINT ["/start-llama.sh"]
