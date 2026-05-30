# LLM #2 — Qwen2.5-0.5B Q4_S (~350MB weights). Slightly larger; keep ctx=256 for 512MB cap.
FROM alpine:3.20 AS model
RUN apk add --no-cache curl
RUN curl -fsSL -o /models/model.gguf \
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_s.gguf"

FROM ghcr.io/ggml-org/llama.cpp:server
COPY --from=model /models/model.gguf /models/model.gguf
COPY shared/start-llama.sh /start-llama.sh
RUN chmod +x /start-llama.sh
ENV LLAMA_MODEL_PATH=/models/model.gguf
ENV LLAMA_CTX=256
ENV LLAMA_THREADS=2
ENV LLAMA_BATCH=128
EXPOSE 8080
ENTRYPOINT ["/start-llama.sh"]
