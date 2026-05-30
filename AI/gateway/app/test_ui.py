"""Browser test UI (llama.cpp-style) + ui-config + direct LLM proxy for metrics."""
import os
from pathlib import Path
from typing import Any

import httpx
from fastapi import Header, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field

from app.llm_client import LlmChoice, chat_completions, resolve_llm
from app.metrics_util import build_metrics

_STATIC = Path(__file__).resolve().parent.parent / "static"
_INDEX = _STATIC / "index.html"

_DEFAULT_KEY = "dev-internal-ai-key"


def _internal_key() -> str:
    return os.getenv("AI_SERVICE_INTERNAL_API_KEY", _DEFAULT_KEY).strip()


def _require_internal_key(x_internal_api_key: str | None) -> None:
    expected = _internal_key()
    if not expected:
        raise HTTPException(status_code=503, detail="AI_SERVICE_INTERNAL_API_KEY not configured")
    if x_internal_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid internal API key")


class ProxyChatRequest(BaseModel):
    messages: list[dict[str, str]] = Field(min_length=1)
    llm: LlmChoice | None = None
    max_tokens: int | None = None


def register_test_ui(app) -> None:
    @app.get("/", include_in_schema=False)
    @app.get("/test", include_in_schema=False)
    async def test_ui_page():
        if _INDEX.is_file():
            return FileResponse(_INDEX)
        return RedirectResponse(url="/docs")

    @app.get("/api/v1/ai/ui-config", include_in_schema=False)
    async def ui_config() -> dict[str, Any]:
        """Defaults for the test UI (API key, model labels, context window)."""
        return {
            "defaultApiKey": _internal_key() or _DEFAULT_KEY,
            "defaultLlm": os.getenv("AI_DEFAULT_LLM", "smol"),
            "defaultMode": "fast",
            "chatMode": os.getenv("AI_CHAT_MODE", "fast"),
            "contextSize": int(os.getenv("LLAMA_CTX", "2048") or "2048"),
            "models": {
                "smol": {
                    "id": "smol",
                    "label": os.getenv(
                        "LLM_SMOL_MODEL_LABEL",
                        "SmolLM-135M-Instruct-Q4_K_S.gguf",
                    ),
                },
                "qwen": {
                    "id": "qwen",
                    "label": os.getenv(
                        "LLM_QWEN_MODEL_LABEL",
                        "Qwen2.5-0.5B-Instruct-Q3_K_S.gguf",
                    ),
                },
            },
        }

    @app.post("/api/v1/ai/proxy/chat", include_in_schema=False)
    async def proxy_chat(
        body: ProxyChatRequest,
        x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
    ) -> dict[str, Any]:
        """Direct llama-server chat — returns OpenAI usage + latency for the test UI."""
        _require_internal_key(x_internal_api_key)
        choice = resolve_llm(body.llm)
        try:
            raw = await chat_completions(
                choice,
                body.messages,
                max_tokens=body.max_tokens,
                fast=True,
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=str(e)) from e

        data = raw["data"]
        latency_ms = raw["latency_ms"]
        usage = data.get("usage") or {}
        pt = usage.get("prompt_tokens")
        ct = usage.get("completion_tokens")
        choices = data.get("choices") or []
        content = ""
        if choices:
            content = (choices[0].get("message", {}) or {}).get("content") or ""

        return {
            "content": content.strip(),
            "llm": choice.value,
            "usage": usage,
            "metrics": build_metrics(
                latency_ms,
                prompt_tokens=pt,
                completion_tokens=ct,
            ),
        }
