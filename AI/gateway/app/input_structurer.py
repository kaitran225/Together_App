"""Tokenize and build structured OpenAI messages before llama-server."""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.chat_history_util import sanitize_openai_messages
from app.input_preprocess import (
    format_user_turn,
    join_messages_for_token_count,
    limit_document_tokens,
    messages_char_weight,
    preprocess_messages,
)
from app.llm_client import LlmChoice, cap_chat_history, llm_base
from app.llm_http import get_http_client
from app.context_summarizer import compress_history_with_summary
from app.prompt_builder import build_chat_system_for_mode, build_context_block

logger = logging.getLogger(__name__)


@dataclass
class StructureMeta:
    prompt_tokens: int
    context_budget: int
    truncated: bool = False
    turns_dropped: int = 0
    system_chars: int = 0
    method: str = "estimate"
    chars_before: int = 0
    chars_after: int = 0
    summarized: bool = False
    summary_method: str | None = None
    turns_summarized: int = 0


@dataclass
class PreparedInput:
    messages: list[dict[str, str]]
    meta: StructureMeta


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    return int(raw)


def _prompt_token_budget() -> int:
    ctx = _int_env("LLAMA_CTX", 1024)
    reserve = _int_env("AI_FAST_MAX_TOKENS", 128)
    if reserve <= 0:
        reserve = _int_env("AI_MAX_TOKENS", 512)
    return max(256, ctx - reserve)


def estimate_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, (len(text) + 3) // 4)


async def count_tokens(choice: LlmChoice, text: str) -> tuple[int, str]:
    """Returns (count, method) using llama-server /tokenize when available."""
    if not text.strip():
        return 0, "empty"
    try:
        client = get_http_client()
        res = await client.post(
            f"{llm_base(choice)}/tokenize",
            json={"content": text, "add_special": False, "parse_special": True},
            timeout=15.0,
        )
        res.raise_for_status()
        tokens = res.json().get("tokens") or []
        return len(tokens), "llama"
    except (httpx.HTTPError, ValueError, KeyError) as e:
        logger.debug("tokenize fallback for %s: %s", choice.value, e)
        return estimate_tokens(text), "estimate"


async def count_messages_tokens(
    choice: LlmChoice, messages: list[dict[str, str]]
) -> tuple[int, str]:
    """One /tokenize call for the full prompt (cheaper than per-turn)."""
    return await count_tokens(choice, join_messages_for_token_count(messages))


def _split_system_and_history(
    raw_messages: list[dict[str, str]],
) -> tuple[str | None, list[dict[str, str]]]:
    system: str | None = None
    rest: list[dict[str, str]] = []
    for msg in raw_messages:
        role = msg.get("role", "")
        if role == "system" and system is None:
            system = msg.get("content", "")
        else:
            rest.append(msg)
    return system, rest


def _build_system_block(
    *,
    personality: str | None,
    document_tokens: list[str] | None,
    system_override: str | None,
    existing_system: str | None,
) -> str:
    if system_override and system_override.strip():
        return system_override.strip()
    if existing_system and existing_system.strip():
        return existing_system.strip()
    docs = limit_document_tokens(document_tokens)
    ctx = build_context_block(docs, None, None)
    return build_chat_system_for_mode(personality, ctx)


async def structure_messages(
    choice: LlmChoice,
    raw_messages: list[dict[str, Any]],
    *,
    personality: str | None = None,
    document_tokens: list[str] | None = None,
    system_override: str | None = None,
) -> PreparedInput:
    """
    Sanitize, compress, add system prompt, token-count, and trim history to fit LLAMA_CTX budget.
    """
    cleaned = sanitize_openai_messages(raw_messages)
    chars_before = messages_char_weight(cleaned)
    cleaned = preprocess_messages(cleaned)

    existing_system, history = _split_system_and_history(cleaned)

    if history and history[-1]["role"] == "user":
        history = history[:-1]

    history = cap_chat_history(history) or []
    history = preprocess_messages(history)

    system = _build_system_block(
        personality=personality,
        document_tokens=document_tokens,
        system_override=system_override,
        existing_system=existing_system,
    )

    last_user = cleaned[-1] if cleaned and cleaned[-1]["role"] == "user" else None
    if not last_user:
        raise ValueError("messages must end with a user turn")

    user_msg = {
        "role": "user",
        "content": format_user_turn(last_user["content"]),
    }

    prefix: list[dict[str, str]] = []
    if system:
        prefix.append({"role": "system", "content": system})

    budget = _prompt_token_budget()
    turns_dropped = 0
    summarized = False
    summary_method: str | None = None
    turns_summarized = 0
    method = "llama"
    char_budget = budget * _int_env("AI_CHARS_PER_TOKEN_EST", 4)

    prefix, history, sum_meta = await compress_history_with_summary(
        choice,
        prefix=prefix,
        history=history,
        user_msg=user_msg,
        budget=budget,
    )
    if sum_meta.get("summarized"):
        summarized = True
        summary_method = sum_meta.get("summaryMethod")
        turns_summarized = int(sum_meta.get("turnsSummarized") or 0)

    while history and messages_char_weight(prefix + history + [user_msg]) > char_budget:
        if len(history) >= 2:
            history = history[2:]
            turns_dropped += 1
        else:
            history = []
            turns_dropped += 1

    total = 0
    while True:
        trial = prefix + history + [user_msg]
        total, m = await count_messages_tokens(choice, trial)
        method = m
        if total <= budget or not history:
            break
        if len(history) >= 2:
            history = history[2:]
            turns_dropped += 1
        else:
            history = []
            turns_dropped += 1

    messages = prefix + history + [user_msg]
    prompt_tokens = total
    truncated = (
        turns_dropped > 0 or prompt_tokens > budget or summarized
    )
    chars_after = messages_char_weight(messages)

    return PreparedInput(
        messages=messages,
        meta=StructureMeta(
            prompt_tokens=prompt_tokens,
            context_budget=budget,
            truncated=truncated,
            turns_dropped=turns_dropped,
            system_chars=len(prefix[0]["content"]) if prefix else len(system),
            method=method,
            chars_before=chars_before,
            chars_after=chars_after,
            summarized=summarized,
            summary_method=summary_method,
            turns_summarized=turns_summarized,
        ),
    )
