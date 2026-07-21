"""Lightweight input normalization before tokenize / LLM — fewer prompt tokens, less CPU."""
from __future__ import annotations

import os
import re
from typing import Any

_ZW_RE = re.compile(r"[\u200b-\u200d\ufeff]")
_WS_RE = re.compile(r"[ \t]+")
_NL_RE = re.compile(r"\n{3,}")


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    return int(raw)


def preprocess_enabled() -> bool:
    return os.getenv("AI_PREPROCESS_INPUT", "true").strip().lower() in ("1", "true", "yes")


def user_turn_prefix_enabled() -> bool:
    """Extra 'User:' prefix — off by default (Gemma/Next use chat templates)."""
    return os.getenv("AI_USER_TURN_PREFIX", "false").strip().lower() in ("1", "true", "yes")


def max_chars_for_role(role: str) -> int:
    if role == "system":
        return _int_env("AI_MAX_SYSTEM_CHARS", 1200)
    if role == "assistant":
        return _int_env("AI_MAX_ASSISTANT_CHARS", 400)
    return _int_env("AI_MAX_USER_CHARS", 800)


def compress_text(text: str, *, max_chars: int | None = None) -> str:
    if not text:
        return ""
    s = _ZW_RE.sub("", text)
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = _NL_RE.sub("\n\n", s)
    lines = [_WS_RE.sub(" ", ln).strip() for ln in s.split("\n")]
    s = "\n".join(ln for ln in lines if ln).strip()
    if max_chars and max_chars > 0 and len(s) > max_chars:
        s = s[: max_chars - 1].rstrip() + "…"
    return s


def limit_document_tokens(tokens: list[str] | None) -> list[str] | None:
    if not tokens:
        return tokens
    max_items = _int_env("AI_DOC_EXCERPT_MAX", 3)
    max_each = _int_env("AI_DOC_EXCERPT_CHARS", 200)
    out: list[str] = []
    for t in tokens[:max_items]:
        c = compress_text(str(t), max_chars=max_each)
        if c:
            out.append(c)
    return out or None


def compress_message(msg: dict[str, str]) -> dict[str, str] | None:
    role = str(msg.get("role") or "").strip().lower()
    content = compress_text(str(msg.get("content") or ""), max_chars=max_chars_for_role(role))
    if role not in ("system", "user", "assistant") or not content:
        return None
    return {"role": role, "content": content}


def merge_adjacent_turns(messages: list[dict[str, str]]) -> list[dict[str, str]]:
    if not messages:
        return messages
    out: list[dict[str, str]] = []
    for msg in messages:
        if out and out[-1]["role"] == msg["role"]:
            joined = f"{out[-1]['content']}\n{msg['content']}".strip()
            cap = max_chars_for_role(msg["role"])
            out[-1]["content"] = compress_text(joined, max_chars=cap)
        else:
            out.append(dict(msg))
    return out


def preprocess_messages(messages: list[dict[str, str]]) -> list[dict[str, str]]:
    if not preprocess_enabled() or not messages:
        return messages
    cleaned: list[dict[str, str]] = []
    for msg in messages:
        c = compress_message(msg)
        if c:
            cleaned.append(c)
    return merge_adjacent_turns(cleaned)


def preprocess_user_message(text: str) -> str:
    if not preprocess_enabled():
        return text.strip()
    return compress_text(text, max_chars=max_chars_for_role("user"))


def format_user_turn(text: str) -> str:
    body = preprocess_user_message(text)
    if not body:
        return body
    if body.startswith("## ") or not user_turn_prefix_enabled():
        return body
    return f"User: {body}"


def messages_char_weight(messages: list[dict[str, str]]) -> int:
    return sum(len(m.get("content", "")) + 8 for m in messages)


def join_messages_for_token_count(messages: list[dict[str, str]]) -> str:
    return "\n".join(f"{m.get('role', '')}: {m.get('content', '')}" for m in messages)
