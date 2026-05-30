# AI — Together Workflow (`.guide/Together_Workflow.pdf`)

## Architecture (from workflow diagram)

| Component | Role |
|-----------|------|
| **LLM Chatbox** | `CHAT` — `getMessage` / attachments |
| **LLM Tool Agent** | `CREATION`, `SUMMARIZE`, `SEARCH` — JSON tool → validate → retry → **Apply** |
| **Prompt Builder** | `gateway/app/prompt_builder.py` |
| **Tool Executioner** | `gateway/app/tool_executor.py` |
| **llm-smol / llm-qwen** | Two LLM backends (llama.cpp on Docker, stubs locally) |

### ACTION_TYPE

`CREATION` | `SUMMARIZE` | `CHAT` | `SEARCH`

### Tool JSON (CREATION)

`CREATE_QUIZ` (Quizlet), `CREATE_FLASHCARD`, `CREATE_MINDMAP`, `CREATE_EVENT`, plus `MESSAGE_SUMMARIZE` for summarize.

### AI Service API (Feign-aligned)

| Method | HTTP |
|--------|------|
| `actionList()` | `GET /api/v1/internal/ai/actions` |
| `getMessage(msg)` | `POST /api/v1/internal/ai/message` |
| `getMessage(msg, attachments)` | `POST /api/v1/internal/ai/message/attachments` |
| Tool Agent | `POST /api/v1/internal/ai/agent` |
| `getEventList(calendar)` | `POST /api/v1/internal/ai/calendar/events` |

Java DTOs: `BE/common/.../ai/api/Ai*.java`

### JSON templates (`AI/templates/`)

Each `*.template.json` includes `template`, `example`, and `llmInstructions` the LLM must follow.

| File | Tool |
|------|------|
| `create_quiz.template.json` | CREATE_QUIZ → Quizlet |
| `create_flashcard.template.json` | CREATE_FLASHCARD |
| `create_mindmap.template.json` | CREATE_MINDMAP |
| `create_event.template.json` | CREATE_EVENT |
| `message_summarize.template.json` | MESSAGE_SUMMARIZE |
| `search.template.json` | SEARCH |

`GET /api/v1/internal/ai/templates` — list all templates.

### Apply (workflow diagram: Validate → **Apply**)

1. **Transform** — `POST /api/v1/internal/ai/apply` with validated `toolJson` → `appliedArtifact` (DB-shaped payload).
2. **Persist** — set `persist: true` on `/agent` or `/apply` to call Workflow `POST /api/v1/internal/ai-tools/apply`.

Agent example:

```bash
curl -X POST http://localhost:8898/api/v1/internal/ai/agent \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Key: dev-internal-ai-key" \
  -d '{
    "message": "Create 3 flashcards about mitosis",
    "action_type": "CREATION",
    "tool": "CREATE_FLASHCARD",
    "user_sso": "user-123",
    "document_id": 1,
    "apply": true,
    "persist": false
  }'
```

---

# AI — 2 lightweight on-device LLMs + gateway

Runs **real small models** in Docker via [llama.cpp](https://github.com/ggml-org/llama.cpp), not cloud APIs. Tuned for **Render free tier (~512MB RAM)** with **~280–320MB idle** per LLM container.

| Container | Model | GGUF size | Typical idle RSS* |
|-----------|--------|-----------|-------------------|
| `llm-smol` | SmolLM2-360M-Instruct Q4_K_M | ~230MB | ~280–320MB |
| `llm-qwen` | Qwen2.5-0.5B-Instruct Q4_K_S | ~350MB | ~300–380MB |
| `ai-gateway` | (router only, Python) | — | ~50–80MB |

\*Idle = model **mmap**’d + `llama-server` with `-c 256 -t 2 -np 1`. Spikes during generation; keep `AI_MAX_TOKENS` low on Render.

## Local

Verify templates + apply (no Docker):

```powershell
py -3 AI/scripts/verify_ai_stack.py
```

### Without Docker (stub LLMs — quick test)

Docker was not required for this path. From repo root:

```powershell
.\AI\scripts\run-local.ps1
```

Starts stub LLMs on **8896** / **8897** and the gateway on **8898** (echo replies, not real inference).

### With Docker (real on-device models)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then:

```bash
docker compose -f AI/docker-compose.yml up --build
```

First start downloads GGUF into the image at build time; cold start may take 1–2 minutes.

- SmolLM: http://localhost:8896/health  
- Qwen: http://localhost:8897/health  
- Gateway: http://localhost:8898/health  
- **Swagger UI:** http://localhost:8898/docs (or `/swagger-ui/index.html`)  
- **OpenAPI JSON:** http://localhost:8898/openapi.json  

In Swagger, click **Authorize** and set `X-Internal-Api-Key` (default local: `dev-internal-ai-key`).

```bash
curl -X POST http://localhost:8898/api/v1/internal/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Key: dev-internal-ai-key" \
  -d '{"message":"What is 2+2?","llm":"smol"}'
```

Use `"llm":"qwen"` for the second model.

Direct OpenAI-compatible API on each LLM:

```bash
curl http://localhost:8896/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hi"}],"max_tokens":64}'
```

## Memory tuning (Render 512MB)

Set on each LLM service:

| Variable | Default | Notes |
|----------|---------|--------|
| `LLAMA_CTX` | `256` | Lower = less KV cache RAM |
| `LLAMA_THREADS` | `2` | Match Render CPU |
| `LLAMA_BATCH` | `128` | Lower if OOM during inference |
| `AI_MAX_TOKENS` | `256` | Gateway cap on reply length |

If `llm-qwen` OOMs on free tier, deploy only `llm-smol` + gateway, or set `LLAMA_CTX=192`.

## Render.com (free tier)

Deploy **3** Docker Web Services (repo root):

| Service | Dockerfile | Health |
|---------|------------|--------|
| together-llm-smol | `AI/render/Dockerfile.llm-smol` | `/health` |
| together-llm-qwen | `AI/render/Dockerfile.llm-qwen` | `/health` |
| together-ai | `AI/render/Dockerfile.gateway` | `/health` |

Gateway env:

- `LLM_SMOL_URL` = public URL of smol service  
- `LLM_QWEN_URL` = public URL of qwen service  
- `AI_SERVICE_INTERNAL_API_KEY` = shared secret  

**Plan limit:** 3 free web services = 3×512MB total account-wide. You can skip the gateway and call each LLM URL from the backend if needed.

Build note: images are ~300–450MB (model baked in). Render build may take several minutes.
