"""Normalize chat history from FE / Java (avoids 422 on empty or invalid turns)."""
from __future__ import annotations

from typing import Any


def coerce_message_field(data: Any) -> Any:
    """Accept `message` or legacy `query` as the user prompt (Render / older clients)."""
    if not isinstance(data, dict):
        return data
    d = dict(data)
    msg = str(d.get("message") or "").strip()
    q = str(d.get("query") or "").strip()
    if msg:
        d["message"] = msg
    elif q:
        d["message"] = q
    else:
        return d
    return d


def sanitize_history_turns(raw: Any) -> list[dict[str, str]] | None:
    if not raw:
        return None
    if not isinstance(raw, list):
        return None
    out: list[dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "").strip().lower()
        content = str(item.get("content") or "").strip()
        if role in ("system", "user", "assistant") and content:
            out.append({"role": role, "content": content})
    return out or None


def sanitize_openai_messages(raw: Any) -> list[dict[str, str]]:
    cleaned = sanitize_history_turns(raw) or []
    if cleaned:
        return cleaned
    raise ValueError("messages must contain at least one user/assistant turn with content")
