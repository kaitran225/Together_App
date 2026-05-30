# LLM #2 — Qwen2.5-0.2B Q4_K_S (~199MB)
FROM alpine:3.20 AS model
RUN apk add --no-cache curl
RUN mkdir -p /models \
 && curl -fsSL -o /models/model.gguf \
  "https://huggingface.co/mradermacher/Qwen2.5-0.2B-GGUF/resolve/main/Qwen2.5-0.2B.Q4_K_S.gguf"

FROM --platform=linux/amd64 ghcr.io/ggml-org/llama.cpp:server
COPY --from=model /models/model.gguf /models/model.gguf
COPY shared/start-llama.sh /start-llama.sh
RUN chmod +x /start-llama.sh
WORKDIR /app
ENV LLAMA_CTX=4096
ENV LLAMA_THREADS=2
ENV LLAMA_BATCH=128
EXPOSE 8080
ENTRYPOINT ["/start-llama.sh"]
