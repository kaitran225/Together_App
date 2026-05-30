"""Stream tokens from llama-server (OpenAI-compatible SSE) → gateway SSE events."""
from __future__ import annotations

import json
import logging
import time
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.llm_client import (
    LlmChoice,
    _build_payload,
    _int_env,
    llm_base,
)
from app.llm_http import get_http_client
from app.metrics_util import build_metrics
from app.sse_util import sse_encode

logger = logging.getLogger(__name__)


async def iter_llm_token_deltas(
    choice: LlmChoice,
    messages: list[dict[str, str]],
    *,
    max_tokens: int | None = None,
    stop: list[str] | None = None,
    fast: bool = False,
) -> AsyncIterator[str]:
    """Yield text fragments from llama-server `stream: true` response."""
    if fast:
        stop = None
        if max_tokens is None:
            max_tokens = _int_env("AI_FAST_MAX_TOKENS", 128)
    payload = _build_payload(messages, max_tokens=max_tokens, stop=stop, stream=True)
    client = get_http_client()
    async with client.stream(
        "POST",
        f"{llm_base(choice)}/v1/chat/completions",
        json=payload,
    ) as res:
        res.raise_for_status()
        async for line in res.aiter_lines():
            if not line.startswith("data:"):
                continue
            raw = line[5:].strip()
            if not raw or raw == "[DONE]":
                continue
            try:
                chunk = json.loads(raw)
            except json.JSONDecodeError:
                continue
            for choice_obj in chunk.get("choices") or []:
                delta = choice_obj.get("delta") or {}
                content = delta.get("content")
                if content:
                    yield str(content)


async def stream_llm_sse(
    choice: LlmChoice,
    messages: list[dict[str, str]],
    *,
    max_tokens: int | None = None,
    stop: list[str] | None = None,
    fast: bool = False,
) -> AsyncIterator[bytes]:
    """
    Gateway SSE: token events as they arrive, then done with full reply + metrics.

    Events:
      - start: { llm }
      - token: { t }
      - done:  { reply, llm, metrics }
      - error: { detail }
    """
    t0 = time.perf_counter()
    parts: list[str] = []
    yield sse_encode("start", {"llm": choice.value})
    try:
        async for piece in iter_llm_token_deltas(
            choice,
            messages,
            max_tokens=max_tokens,
            stop=stop,
            fast=fast,
        ):
            parts.append(piece)
            yield sse_encode("token", {"t": piece})
    except httpx.HTTPError as e:
        logger.warning("LLM stream failed: %s", e)
        yield sse_encode("error", {"detail": str(e)})
        return

    reply = "".join(parts).strip()
    latency_ms = (time.perf_counter() - t0) * 1000.0
    completion_tokens = len(reply.split()) if reply else 0  # rough; UI also counts chars
    if reply:
        completion_tokens = max(completion_tokens, (len(reply) + 3) // 4)
    metrics = build_metrics(
        latency_ms,
        completion_tokens=completion_tokens if reply else 0,
    )
    if not reply:
        yield sse_encode("error", {"detail": "LLM returned empty stream"})
        return
    yield sse_encode(
        "done",
        {"reply": reply, "llm": choice.value, "metrics": metrics},
    )
