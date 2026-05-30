"""Normalize chat history from FE / Java (avoids 422 on empty or invalid turns)."""
from __future__ import annotations

from typing import Any


def coerce_message_field(data: Any) -> Any:
    """
    Normalize user text from multiple client / deploy shapes:
    - message: "hello"
    - query: "hello"
    - query: { body: "hello" }   (legacy Render / older gateway)
    """
    if not isinstance(data, dict):
        return data
    d = dict(data)
    msg = str(d.get("message") or "").strip()
    q = d.get("query")

    if isinstance(q, dict):
        nested = str(q.get("body") or q.get("message") or "").strip()
        if nested and not msg:
            msg = nested
    elif isinstance(q, str) and q.strip() and not msg:
        msg = q.strip()

    if not msg:
        return d

    d["message"] = msg
    # Keep legacy nested shape so older validators expecting query.body pass too
    d["query"] = {"body": msg}
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
    from app.input_preprocess import preprocess_messages

    cleaned = sanitize_history_turns(raw) or []
    if cleaned:
        return preprocess_messages(cleaned)
    raise ValueError("messages must contain at least one user/assistant turn with content")
