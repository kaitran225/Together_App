# LLM #1 — SmolLM-135M-Instruct Q4_K_S (~102MB). Text chat (instruct-tuned).
FROM alpine:3.20 AS model
RUN apk add --no-cache curl
RUN mkdir -p /models \
 && curl -fsSL -o /models/model.gguf \
  "https://huggingface.co/second-state/SmolLM-135M-Instruct-GGUF/resolve/main/SmolLM-135M-Instruct-Q4_K_S.gguf"

FROM --platform=linux/amd64 ghcr.io/ggml-org/llama.cpp:server
COPY --from=model /models/model.gguf /models/model.gguf
COPY shared/start-llama.sh /start-llama.sh
RUN chmod +x /start-llama.sh
WORKDIR /app
ENV LLAMA_CTX=1024
ENV LLAMA_THREADS=2
ENV LLAMA_BATCH=512
ENV LLAMA_CACHE_TYPE_K=q8_0
ENV LLAMA_CACHE_TYPE_V=q8_0
ENV LLAMA_MLOCK=1
EXPOSE 8080
ENTRYPOINT ["/start-llama.sh"]
