"""Dynamic chat-history summarization when context exceeds the token budget."""
from __future__ import annotations

import logging
import os
from typing import Any

from app.input_preprocess import compress_text, messages_char_weight
from app.llm_client import LlmChoice, complete_messages_fast

logger = logging.getLogger(__name__)


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    return int(raw)


def context_summarize_enabled() -> bool:
    return os.getenv("AI_CONTEXT_SUMMARIZE", "true").strip().lower() in ("1", "true", "yes")


def extractive_only() -> bool:
    return os.getenv("AI_CONTEXT_SUMMARIZE_EXTRACTIVE_ONLY", "false").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def prompt_token_budget() -> int:
    ctx = _int_env("LLAMA_CTX", 1024)
    reserve = _int_env("AI_FAST_MAX_TOKENS", 128)
    if reserve <= 0:
        reserve = _int_env("AI_MAX_TOKENS", 512)
    return max(256, ctx - reserve)


def split_chat_messages(
    messages: list[dict[str, str]],
) -> tuple[list[dict[str, str]], list[dict[str, str]], dict[str, str] | None]:
    """Leading system block, middle history, final user turn."""
    i = 0
    prefix: list[dict[str, str]] = []
    while i < len(messages) and messages[i].get("role") == "system":
        prefix.append(messages[i])
        i += 1
    rest = list(messages[i:])
    last_user: dict[str, str] | None = None
    if rest and rest[-1].get("role") == "user":
        last_user = rest.pop()
    return prefix, rest, last_user


def history_to_transcript(turns: list[dict[str, str]]) -> str:
    lines: list[str] = []
    for t in turns:
        role = str(t.get("role", "")).strip().lower()
        content = str(t.get("content", "")).strip()
        if not content:
            continue
        label = "User" if role == "user" else "Assistant" if role == "assistant" else role.capitalize()
        lines.append(f"{label}: {content}")
    return "\n".join(lines)


def extractive_summary(
    turns: list[dict[str, str]],
    *,
    max_chars: int | None = None,
) -> str:
    cap = max_chars if max_chars is not None else _int_env("AI_CONTEXT_SUMMARY_MAX_CHARS", 320)
    snippet_each = _int_env("AI_CONTEXT_SUMMARIZE_SNIPPET_CHARS", 72)
    parts: list[str] = []
    for t in turns:
        role = str(t.get("role", "")).strip().lower()
        tag = "U" if role == "user" else "A" if role == "assistant" else "?"
        bit = compress_text(str(t.get("content", "")), max_chars=snippet_each)
        if bit:
            parts.append(f"{tag}: {bit}")
    return compress_text("; ".join(parts), max_chars=cap)


async def summarize_turns_llm(
    choice: LlmChoice,
    turns: list[dict[str, str]],
) -> tuple[str, str]:
    transcript = history_to_transcript(turns)
    if not transcript.strip():
        return "", "empty"
    max_out = _int_env("AI_CONTEXT_SUMMARIZE_MAX_TOKENS", 72)
    messages = [
        {
            "role": "system",
            "content": (
                "Summarize the conversation below in 2-4 short sentences. "
                "Keep the topic, names, numbers, and what the user wants. Plain text only."
            ),
        },
        {"role": "user", "content": transcript},
    ]
    try:
        text = await complete_messages_fast(choice, messages, max_tokens=max_out)
        summary = compress_text(
            text,
            max_chars=_int_env("AI_CONTEXT_SUMMARY_MAX_CHARS", 320),
        )
        if summary:
            return summary, "llm"
    except Exception as e:
        logger.warning("LLM context summary failed (%s), using extractive", e)
    return extractive_summary(turns), "extractive"


async def build_history_summary(
    choice: LlmChoice,
    turns: list[dict[str, str]],
) -> tuple[str, str]:
    if extractive_only():
        return extractive_summary(turns), "extractive"
    return await summarize_turns_llm(choice, turns)


def append_summary_to_prefix(
    prefix: list[dict[str, str]],
    summary: str,
) -> list[dict[str, str]]:
    block = f"Earlier conversation (summary):\n{summary.strip()}"
    out = [dict(m) for m in prefix]
    if out and out[0].get("role") == "system":
        out[0] = {
            "role": "system",
            "content": f"{out[0]['content'].rstrip()}\n\n{block}",
        }
    else:
        out.insert(0, {"role": "system", "content": block})
    return out


async def _message_token_count(
    choice: LlmChoice,
    messages: list[dict[str, str]],
) -> int:
    from app.input_structurer import count_messages_tokens

    total, _ = await count_messages_tokens(choice, messages)
    return total


def _over_budget(
    messages: list[dict[str, str]],
    *,
    budget: int,
    char_budget: int,
) -> bool:
    if messages_char_weight(messages) > char_budget:
        return True
    return False


async def compress_history_with_summary(
    choice: LlmChoice,
    *,
    prefix: list[dict[str, str]],
    history: list[dict[str, str]],
    user_msg: dict[str, str],
    budget: int | None = None,
) -> tuple[list[dict[str, str]], list[dict[str, str]], dict[str, Any]]:
    """
    When over budget, summarize dropped older turns into the system block.
    Returns (prefix, history, meta).
    """
    meta: dict[str, Any] = {
        "summarized": False,
        "summaryMethod": None,
        "turnsSummarized": 0,
    }
    if not context_summarize_enabled() or not history:
        return prefix, history, meta

    budget = budget if budget is not None else prompt_token_budget()
    char_budget = budget * _int_env("AI_CHARS_PER_TOKEN_EST", 4)
    min_msgs = _int_env("AI_CONTEXT_SUMMARIZE_MIN_MSGS", 4)
    keep_msgs = _int_env("AI_CONTEXT_SUMMARIZE_KEEP_MSGS", 4)

    trial = prefix + history + [user_msg]
    if len(history) < min_msgs:
        return prefix, history, meta

    try:
        tokens = await _message_token_count(choice, trial)
    except Exception:
        tokens = budget + 1

    if tokens <= budget and not _over_budget(trial, budget=budget, char_budget=char_budget):
        return prefix, history, meta

    if len(history) <= keep_msgs:
        return prefix, history, meta

    old = history[:-keep_msgs]
    recent = history[-keep_msgs:]
    summary, method = await build_history_summary(choice, old)
    if not summary:
        return prefix, history, meta

    new_prefix = append_summary_to_prefix(prefix, summary)
    meta = {
        "summarized": True,
        "summaryMethod": method,
        "turnsSummarized": len(old),
    }
    return new_prefix, recent, meta


async def apply_dynamic_context_to_messages(
    choice: LlmChoice,
    messages: list[dict[str, str]],
    *,
    budget: int | None = None,
) -> tuple[list[dict[str, str]], dict[str, Any]]:
    """Run dynamic summarization on a full OpenAI-style message list."""
    prefix, history, last_user = split_chat_messages(messages)
    if not last_user:
        return messages, {}
    new_prefix, new_history, meta = await compress_history_with_summary(
        choice,
        prefix=prefix,
        history=history,
        user_msg=last_user,
        budget=budget,
    )
    return new_prefix + new_history + [last_user], meta
