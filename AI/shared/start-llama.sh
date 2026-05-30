#!/bin/sh
# Low-RAM llama-server for Render free tier (~512MB). Model is mmap'd from disk.
set -eu

PORT="${PORT:-8080}"
CTX="${LLAMA_CTX:-256}"
THREADS="${LLAMA_THREADS:-2}"
BATCH="${LLAMA_BATCH:-128}"
MODEL="${LLAMA_MODEL_PATH:-/models/model.gguf}"
LLAMA_SERVER="${LLAMA_SERVER_BIN:-/app/llama-server}"

exec "${LLAMA_SERVER}" \
  -m "${MODEL}" \
  --host 0.0.0.0 \
  --port "${PORT}" \
  -c "${CTX}" \
  -t "${THREADS}" \
  -np 1 \
  -b "${BATCH}"
