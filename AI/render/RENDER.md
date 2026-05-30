# Render.com — Root Directory: **AI** (this folder)

Deploy **3 Web Services** (Docker). Do **not** use repo root unless you change COPY paths.

| Render service name | Root Directory | Dockerfile path | Health check |
|---------------------|----------------|-----------------|--------------|
| together-llm-smol | `AI` | `render/Dockerfile.llm-smol` | `/health` |
| together-llm-qwen | `AI` | `render/Dockerfile.llm-qwen` | `/health` |
| together-ai | `AI` | `render/Dockerfile.gateway` | `/health` |

## Environment — llm-smol / llm-qwen

```
LLAMA_CTX=256
LLAMA_THREADS=2
LLAMA_BATCH=128
```

(Render sets `PORT` automatically.)

## Environment — ai-gateway

```
AI_SERVICE_INTERNAL_API_KEY=<your-secret>
LLM_SMOL_URL=https://together-llm-smol.onrender.com
LLM_QWEN_URL=https://together-llm-qwen.onrender.com
AI_DEFAULT_LLM=smol
AI_MAX_TOKENS=256
```

Optional persist to workflow:

```
WORKFLOW_SERVICE_BASE_URL=https://together-workflow.onrender.com
WORKFLOW_SERVICE_INTERNAL_API_KEY=<workflow-secret>
```

## Build note

First deploy downloads GGUF models during Docker build (3–10 min).

- **Smol (VLM):** `ggml-org/SmolVLM-256M-Instruct-GGUF` from [HuggingFaceTB/SmolVLM-256M-Instruct](https://huggingface.co/HuggingFaceTB/SmolVLM-256M-Instruct) — `SmolVLM-256M-Instruct-Q8_0.gguf` + `mmproj-SmolVLM-256M-Instruct-Q8_0.gguf` (~279MB total)
- **Qwen:** `mradermacher/Qwen2.5-0.2B-GGUF` → `Qwen2.5-0.2B.Q8_0.gguf` (~246MB)

## Local equivalent

From repo root:

```bash
docker compose -f AI/docker-compose.yml up --build
```

Or with Root Directory `AI`:

```bash
docker compose up --build
```
