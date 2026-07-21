#!/bin/sh
# llama-server tuned for Render free tier (~512MB RAM, CPU-only).
# Smaller ctx + quantized KV cache = less RAM and faster token generation.
set -eu

PORT="${PORT:-8080}"
CTX="${LLAMA_CTX:-1024}"
THREADS="${LLAMA_THREADS:-2}"
TBATCH="${LLAMA_THREADS_BATCH:-$THREADS}"
BATCH="${LLAMA_BATCH:-512}"
TEMP="${LLAMA_TEMP:-0.7}"
TOP_P="${LLAMA_TOP_P:-0.9}"
TOP_K="${LLAMA_TOP_K:-40}"
REPEAT="${LLAMA_REPEAT_PENALTY:-1.15}"
CACHE_K="${LLAMA_CACHE_TYPE_K:-q8_0}"
CACHE_V="${LLAMA_CACHE_TYPE_V:-q8_0}"
PRIO="${LLAMA_PRIO:-2}"
POLL="${LLAMA_POLL:-50}"
MODEL="${LLAMA_MODEL_PATH:-/models/model.gguf}"
MMPROJ="${LLAMA_MMPROJ_PATH:-}"
LLAMA_SERVER="${LLAMA_SERVER_BIN:-/app/llama-server}"

set -- "${LLAMA_SERVER}" \
  -m "${MODEL}" \
  --host 0.0.0.0 \
  --port "${PORT}" \
  -c "${CTX}" \
  -t "${THREADS}" \
  -tb "${TBATCH}" \
  -np 1 \
  -b "${BATCH}" \
  --temp "${TEMP}" \
  --top-p "${TOP_P}" \
  --top-k "${TOP_K}" \
  --repeat-penalty "${REPEAT}" \
  --cache-type-k "${CACHE_K}" \
  --cache-type-v "${CACHE_V}" \
  --prio "${PRIO}" \
  --poll "${POLL}"

# Optional: keep weights resident (smol ~100MB OK; avoid on large qwen + low RAM)
if [ "${LLAMA_MLOCK:-0}" = "1" ]; then
  set -- "$@" --mlock
fi

if [ -n "${MMPROJ}" ]; then
  set -- "$@" --mmproj "${MMPROJ}" --no-mmproj-offload
fi

echo "llama-server: ctx=${CTX} threads=${THREADS} batch=${BATCH} cache_k=${CACHE_K} model=${MODEL}" >&2
exec "$@"
