# LLM #1 — SmolVLM-256M-Instruct (vision+text). ggml-org GGUF for llama.cpp.
FROM alpine:3.20 AS model
RUN apk add --no-cache curl
RUN mkdir -p /models \
 && curl -fsSL -o /models/model.gguf \
  "https://huggingface.co/ggml-org/SmolVLM-256M-Instruct-GGUF/resolve/main/SmolVLM-256M-Instruct-Q8_0.gguf" \
 && curl -fsSL -o /models/mmproj.gguf \
  "https://huggingface.co/ggml-org/SmolVLM-256M-Instruct-GGUF/resolve/main/mmproj-SmolVLM-256M-Instruct-Q8_0.gguf"

FROM --platform=linux/amd64 ghcr.io/ggml-org/llama.cpp:server
COPY --from=model /models/model.gguf /models/model.gguf
COPY --from=model /models/mmproj.gguf /models/mmproj.gguf
COPY shared/start-llama.sh /start-llama.sh
RUN chmod +x /start-llama.sh
WORKDIR /app
ENV LLAMA_MODEL_PATH=/models/model.gguf
ENV LLAMA_MMPROJ_PATH=/models/mmproj.gguf
ENV LLAMA_CTX=256
ENV LLAMA_THREADS=2
ENV LLAMA_BATCH=128
EXPOSE 8080
ENTRYPOINT ["/start-llama.sh"]
