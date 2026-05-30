#!/bin/sh
# Low-RAM llama-server for Render free tier (~512MB). Model is mmap'd from disk.
set -eu

PORT="${PORT:-8080}"
CTX="${LLAMA_CTX:-256}"
THREADS="${LLAMA_THREADS:-2}"
BATCH="${LLAMA_BATCH:-128}"
MODEL="${LLAMA_MODEL_PATH:-/models/model.gguf}"

exec llama-server \
  -m "${MODEL}" \
  --host 0.0.0.0 \
  --port "${PORT}" \
  -c "${CTX}" \
  -t "${THREADS}" \
  -np 1 \
  -b "${BATCH}"
