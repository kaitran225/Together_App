# LLM #1 — SmolLM2-360M Q4_K_M (~271MB). bartowski quant; official HF repo only ships q8_0.
FROM alpine:3.20 AS model
RUN apk add --no-cache curl
RUN mkdir -p /models \
 && curl -fsSL -o /models/model.gguf \
  "https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q4_K_M.gguf"

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
