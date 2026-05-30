#!/bin/sh
# Low-RAM llama-server for Render free tier (~512MB). Model is mmap'd from disk.
set -eu

PORT="${PORT:-8080}"
CTX="${LLAMA_CTX:-2048}"
THREADS="${LLAMA_THREADS:-2}"
BATCH="${LLAMA_BATCH:-128}"
TEMP="${LLAMA_TEMP:-0.7}"
TOP_P="${LLAMA_TOP_P:-0.9}"
TOP_K="${LLAMA_TOP_K:-40}"
REPEAT="${LLAMA_REPEAT_PENALTY:-1.15}"
MODEL="${LLAMA_MODEL_PATH:-/models/model.gguf}"
MMPROJ="${LLAMA_MMPROJ_PATH:-}"
LLAMA_SERVER="${LLAMA_SERVER_BIN:-/app/llama-server}"

set -- "${LLAMA_SERVER}" \
  -m "${MODEL}" \
  --host 0.0.0.0 \
  --port "${PORT}" \
  -c "${CTX}" \
  -t "${THREADS}" \
  -np 1 \
  -b "${BATCH}" \
  --temp "${TEMP}" \
  --top-p "${TOP_P}" \
  --top-k "${TOP_K}" \
  --repeat-penalty "${REPEAT}"

if [ -n "${MMPROJ}" ]; then
  set -- "$@" --mmproj "${MMPROJ}" --no-mmproj-offload
fi

exec "$@"
