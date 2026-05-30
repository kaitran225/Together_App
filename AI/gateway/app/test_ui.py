"""Browser test UI + direct LLM proxy with input structuring."""
import os
from pathlib import Path
from typing import Any

import httpx
from fastapi import Header, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field

from app.input_structurer import structure_messages
from app.llm_client import LlmChoice, chat_completions, resolve_llm
from app.llm_stream import structure_meta_dict
from app.metrics_util import build_metrics
from app.proxy_models import ProxyChatRequest

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


class StructurePreviewRequest(BaseModel):
    messages: list[dict[str, str]] = Field(min_length=1)
    llm: LlmChoice | None = None


def register_test_ui(app) -> None:
    @app.get("/", include_in_schema=False)
    @app.get("/test", include_in_schema=False)
    async def test_ui_page():
        if _INDEX.is_file():
            return FileResponse(_INDEX)
        return RedirectResponse(url="/docs")

    @app.get("/api/v1/ai/ui-config", include_in_schema=False)
    async def ui_config() -> dict[str, Any]:
        return {
            "defaultApiKey": _internal_key() or _DEFAULT_KEY,
            "defaultLlm": os.getenv("AI_DEFAULT_LLM", "smol"),
            "defaultMode": "direct",
            "contextSize": int(os.getenv("LLAMA_CTX", "1024") or "1024"),
            "structureInput": os.getenv("AI_STRUCTURE_INPUT", "true"),
            "models": {
                "smol": {
                    "id": "smol",
                    "label": os.getenv(
                        "LLM_SMOL_MODEL_LABEL",
                        "google/gemma-3-270m-it (Q4_K_S)",
                    ),
                },
                "qwen": {
                    "id": "qwen",
                    "label": os.getenv(
                        "LLM_QWEN_MODEL_LABEL",
                        "Lamapi/next-270m (Q3_K_M)",
                    ),
                },
            },
        }

    @app.post("/api/v1/ai/structure", include_in_schema=False)
    async def preview_structure(
        body: StructurePreviewRequest,
        x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
    ) -> dict[str, Any]:
        """Preview tokenized / structured messages (no LLM call)."""
        _require_internal_key(x_internal_api_key)
        choice = resolve_llm(body.llm)
        prepared = await structure_messages(choice, body.messages)
        return {
            "messages": prepared.messages,
            "structure": structure_meta_dict(prepared.meta),
        }

    @app.post("/api/v1/ai/proxy/chat", include_in_schema=False)
    async def proxy_chat(
        body: ProxyChatRequest,
        x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
    ) -> dict[str, Any]:
        """Direct llama-server chat with optional input structuring."""
        _require_internal_key(x_internal_api_key)
        choice = resolve_llm(body.llm)
        struct_out: dict[str, Any] | None = None
        if body.use_structure():
            prepared = await structure_messages(
                choice,
                body.messages,
                personality=body.personality,
                document_tokens=body.document_tokens,
                system_override=body.system,
            )
            messages = prepared.messages
            struct_out = structure_meta_dict(prepared.meta)
        else:
            messages = body.messages

        try:
            raw = await chat_completions(
                choice,
                messages,
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

        out: dict[str, Any] = {
            "content": content.strip(),
            "llm": choice.value,
            "usage": usage,
            "metrics": build_metrics(
                latency_ms,
                prompt_tokens=pt,
                completion_tokens=ct,
            ),
        }
        if struct_out:
            out["structure"] = struct_out
        return out
