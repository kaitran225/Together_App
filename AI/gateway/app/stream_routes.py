"""SSE streaming chat endpoints (token-by-token from llama-server)."""
from __future__ import annotations

import httpx
from fastapi import Header
from fastapi.responses import StreamingResponse
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.chat_history_util import sanitize_history_turns, sanitize_openai_messages
from app.llm_client import CHAT_STOP, LlmChoice, chat_mode, resolve_llm
from app.llm_stream import stream_llm_sse
from app.sse_util import SSE_HEADERS, sse_encode
from app.tool_executor import messages_for_fast_chat, messages_for_workflow_chat


def _streaming_response(gen) -> StreamingResponse:
    return StreamingResponse(
        gen,
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


class ProxyChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    messages: list[dict[str, Any]] = Field(min_length=1)
    llm: LlmChoice | None = None
    max_tokens: int | None = None

    @field_validator("messages", mode="before")
    @classmethod
    def _clean_messages(cls, v: Any) -> list[dict[str, str]]:
        return sanitize_openai_messages(v)


def register_stream_routes(app, *, require_internal_key, ctx_from_message) -> None:
    from app.main import FastChatRequest, MessageRequest

    @app.post("/api/v1/internal/ai/chat/fast/stream", tags=["Chat"])
    async def chat_fast_stream(
        body: FastChatRequest,
        x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
    ):
        """Stream fast chat as SSE: `start` → `token`* → `done` (or `error`)."""
        require_internal_key(x_internal_api_key)
        choice = resolve_llm(body.llm)
        history = (
            [{"role": t.role, "content": t.content} for t in body.chat_history]
            if body.chat_history
            else None
        )
        # Current turn is body.message; history must not include it again
        if history and history[-1].get("role") == "user" and history[-1].get("content") == body.message:
            history = history[:-1] or None
        messages = messages_for_fast_chat(
            body.message,
            chat_history=history,
            system_override=body.system,
        )

        async def gen():
            try:
                async for chunk in stream_llm_sse(
                    choice,
                    messages,
                    max_tokens=body.max_tokens,
                    fast=True,
                ):
                    yield chunk
            except httpx.HTTPError as e:
                yield sse_encode("error", {"detail": str(e)})

        return _streaming_response(gen())

    @app.post("/api/v1/internal/ai/message/stream", tags=["Chat"])
    async def message_stream(
        body: MessageRequest,
        x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
    ):
        """Stream workflow chat as SSE (`done` includes full reply + metrics)."""
        require_internal_key(x_internal_api_key)
        choice = resolve_llm(body.llm)
        personality, docs, cal, behavior, history = ctx_from_message(body.context)
        messages = messages_for_workflow_chat(
            body.message,
            personality=personality,
            document_tokens=docs,
            calendar_json=cal,
            user_behavior=behavior,
            chat_history=history,
        )
        use_fast = chat_mode() == "fast"

        async def gen():
            try:
                async for chunk in stream_llm_sse(
                    choice,
                    messages,
                    stop=None if use_fast else CHAT_STOP,
                    fast=use_fast,
                ):
                    yield chunk
            except httpx.HTTPError as e:
                yield sse_encode("error", {"detail": str(e)})

        return _streaming_response(gen())

    @app.post("/api/v1/ai/proxy/chat/stream", include_in_schema=False)
    async def proxy_chat_stream(
        body: ProxyChatRequest,
        x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
    ):
        """Direct llama-server SSE stream for the test UI."""
        require_internal_key(x_internal_api_key)
        choice = resolve_llm(body.llm)

        async def gen():
            try:
                async for chunk in stream_llm_sse(
                    choice,
                    body.messages,
                    max_tokens=body.max_tokens,
                    fast=True,
                ):
                    yield chunk
            except httpx.HTTPError as e:
                yield sse_encode("error", {"detail": str(e)})

        return _streaming_response(gen())
