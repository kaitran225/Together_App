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
| `llm-smol` | SmolLM-135M-**Instruct** Q8_0 | ~145MB | ~180–260MB |
| `llm-qwen` | Qwen2.5-0.5B-**Instruct** Q4_K_S | ~368MB | ~280–400MB |
| `ai-gateway` | (router only, Python) | — | ~50–80MB |

\*Idle = model **mmap**’d + `llama-server` with `-c 4096 -t 2 -np 1`. Lower `LLAMA_CTX` on Render if OOM.

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
- **Test UI:** http://localhost:8898/ (chat + health; set `X-Internal-Api-Key`)  
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
  -d '{"messages":[{"role":"user","content":"Hi"}],"max_tokens":128,"temperature":0.7,"repeat_penalty":1.15,"top_p":0.9}'
```

### Testing in LM Studio / llama.cpp UI

If you load `model.gguf` directly (not via gateway), use the **Instruct** files from the Dockerfiles and set:

- Temperature **0.7**, Top P **0.9**, Repeat penalty **1.15**
- Max tokens **256–512** (avoid unlimited — causes long JSON spam on weak models)
- Do **not** use base `Qwen2.5-0.2B` / `DogeAI2.5-0.2B` for chat

## LLM Docker speed (what actually helps)

On Render **free tier**, slowness is mostly **CPU inference + cold start**, not the gateway wrapper.

| Lever | What we did |
|-------|-------------|
| **Smaller GGUF** | smol **Q4_K_S** (~102MB), qwen **Q3_K_S** (~322MB) — rebuild both LLM images |
| **`LLAMA_CTX=1024`** | Half the KV RAM vs 2048 → faster tokens, less OOM |
| **`LLAMA_CACHE_TYPE_K/V=q8_0`** | Quantized KV cache (set in `start-llama.sh`) |
| **`LLAMA_BATCH=512`** (smol) | Faster prompt processing on CPU |
| **Use smol only** | qwen is ~3× heavier; set `AI_DEFAULT_LLM=smol` and skip the qwen service if RAM is tight |
| **Keep warm** | Render sleeps after ~15min idle — first chat after sleep is 30–60s; use UptimeRobot/cron on `/health` |

You will **not** match Gemini/OpenAI on 512MB CPU. For production chat speed, use a hosted API (`AI_PROVIDER=gemini` on Java Auth) and keep on-device LLMs for offline/dev only.

After changing Dockerfiles, **redeploy `dev-together-ai-smol` and `dev-together-ai-qwen`** (full rebuild — new model download).

## Memory tuning (Render 512MB)

Set on each LLM service:

| Variable | Default | Notes |
|----------|---------|--------|
| `LLAMA_CTX` | `1024` | KV cache size; try `512` if OOM |
| `LLAMA_THREADS` | `2` | Match Render CPU (try `1` if contended) |
| `LLAMA_BATCH` | `512` (smol) / `256` (qwen) | Prompt batch; lower if OOM |
| `LLAMA_CACHE_TYPE_K` / `V` | `q8_0` | Quantized KV cache |
| `LLAMA_MLOCK` | `1` on smol | Keep small model in RAM; **off** for qwen on 512MB |
| `AI_MAX_TOKENS` | `512` | Cap reply length (full / tool agent mode) |
| `AI_CHAT_MODE` | `fast` | `fast` = lite tutor prompt + 128 tok; `full` = longer prompts |
| `AI_FAST_MAX_TOKENS` | `128` | Shorter replies = faster on CPU llama-server |
| `AI_CHAT_HISTORY_MAX_TURNS` | `6` | Only last N turns sent to the LLM |
| `AI_REPEAT_PENALTY` | `1.15` | Reduces repetitive outputs |

**Fast chat (Java / mobile):** `POST /api/v1/internal/ai/chat/fast` — minimal wrapper, no tool templates. Same key header as other internal routes.

**Streaming (SSE):** append `/stream` for token-by-token UX (`text/event-stream`):

| Endpoint | Events |
|----------|--------|
| `POST /api/v1/internal/ai/chat/fast/stream` | `start` → `token` `{t}` → `done` `{reply, metrics}` |
| `POST /api/v1/internal/ai/message/stream` | same (workflow chat) |
| `POST /api/v1/ai/proxy/chat/stream` | same (test UI / raw messages) |

Example client: `fetch` + `ReadableStream`, parse `event:` / `data:` lines (see test UI at `/`).

Pass prior turns in `context.chatHistory` (`user` / `assistant`). Document/calendar/behavior context is not truncated.

If a service OOMs on free tier, lower `LLAMA_CTX` (e.g. `2048`) or deploy one LLM + gateway only.

## Render.com (free tier)

**Root Directory: `AI`** — full steps in [render/RENDER.md](render/RENDER.md).

| Service | Dockerfile (from `AI/`) | Health |
|---------|-------------------------|--------|
| together-llm-smol | `render/Dockerfile.llm-smol` | `/health` |
| together-llm-qwen | `render/Dockerfile.llm-qwen` | `/health` |
| together-ai | `render/Dockerfile.gateway` | `/health` |

Gateway env:

- `LLM_SMOL_URL` = public URL of smol service  
- `LLM_QWEN_URL` = public URL of qwen service  
- `AI_SERVICE_INTERNAL_API_KEY` = shared secret  

**Plan limit:** 3 free web services = 3×512MB total account-wide. You can skip the gateway and call each LLM URL from the backend if needed.

Build note: images are ~300–450MB (model baked in). Render build may take several minutes.
