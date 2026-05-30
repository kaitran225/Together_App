import logging
import os
import time
from enum import Enum
from typing import Any

import httpx

from app.llm_http import get_http_client

logger = logging.getLogger(__name__)

_COMPOSE_SMOL = "http://llm-smol:8080"
_COMPOSE_QWEN = "http://llm-qwen:8080"


class LlmChoice(str, Enum):
    smol = "smol"
    qwen = "qwen"


def get_smol_url() -> str:
    return os.getenv("LLM_SMOL_URL", _COMPOSE_SMOL).rstrip("/")


def get_qwen_url() -> str:
    return os.getenv("LLM_QWEN_URL", _COMPOSE_QWEN).rstrip("/")


def llm_env_configured() -> bool:
    return bool(os.getenv("LLM_SMOL_URL", "").strip() and os.getenv("LLM_QWEN_URL", "").strip())


def using_compose_default_urls() -> bool:
    return get_smol_url() == _COMPOSE_SMOL and get_qwen_url() == _COMPOSE_QWEN


def log_llm_url_config() -> None:
    if llm_env_configured():
        logger.info("LLM backends: smol=%s qwen=%s", get_smol_url(), get_qwen_url())
    else:
        logger.warning(
            "LLM_SMOL_URL / LLM_QWEN_URL not set — using Docker Compose defaults (%s, %s). "
            "On Render, set both on the GATEWAY service and redeploy.",
            _COMPOSE_SMOL,
            _COMPOSE_QWEN,
        )


def chat_mode() -> str:
    """`fast` = lite prompt, no stop tokens, lower max_tokens (default). `full` = workflow tutor."""
    return os.getenv("AI_CHAT_MODE", "fast").strip().lower()


def cap_chat_history(
    history: list[dict[str, str]] | None,
    *,
    max_turns: int | None = None,
) -> list[dict[str, str]] | None:
    if not history:
        return history
    limit = max_turns if max_turns is not None else _int_env("AI_CHAT_HISTORY_MAX_TURNS", 4)
    if limit <= 0:
        return history
    return history[-limit:]


def resolve_llm(choice: LlmChoice | None) -> LlmChoice:
    if choice is not None:
        return choice
    default = os.getenv("AI_DEFAULT_LLM", "smol").lower()
    try:
        return LlmChoice(default)
    except ValueError:
        return LlmChoice.smol


def llm_base(choice: LlmChoice) -> str:
    return get_smol_url() if choice == LlmChoice.smol else get_qwen_url()


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    return int(raw)


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return default
    return float(raw)


def _build_payload(
    messages: list[dict[str, str]],
    *,
    max_tokens: int | None,
    stop: list[str] | None,
    stream: bool = False,
) -> dict:
    payload: dict = {
        "messages": messages,
        "temperature": _float_env("AI_TEMPERATURE", 0.7),
        "top_p": _float_env("AI_TOP_P", 0.9),
        "top_k": _int_env("AI_TOP_K", 40),
        "repeat_penalty": _float_env("AI_REPEAT_PENALTY", 1.15),
        "frequency_penalty": _float_env("AI_FREQUENCY_PENALTY", 0.1),
        "stream": stream,
    }
    cap = max_tokens if max_tokens is not None else _int_env("AI_MAX_TOKENS", 512)
    if cap > 0:
        payload["max_tokens"] = cap
    if stop:
        cleaned = [s for s in stop if s and str(s).strip()]
        if cleaned:
            payload["stop"] = cleaned
    return payload


# Plain chat only — do NOT include "" (matches immediately → empty replies on llama-server)
CHAT_STOP = ["<|endoftext|>", "<|end|>", "\n\nUser:", "\n\nHuman:"]


async def complete_messages(
    choice: LlmChoice,
    messages: list[dict[str, str]],
    *,
    max_tokens: int | None = None,
    stop: list[str] | None = None,
) -> str:
    payload = _build_payload(messages, max_tokens=max_tokens, stop=stop)

    client = get_http_client()
    res = await client.post(
        f"{llm_base(choice)}/v1/chat/completions",
        json=payload,
    )
    res.raise_for_status()
    data = res.json()

    choices = data.get("choices") or []
    if not choices:
        raise httpx.HTTPError("Empty LLM response")
    content = _extract_assistant_text(choices[0])
    if not content.strip() and stop:
        logger.warning(
            "LLM returned empty content with stop=%s; retrying without stop sequences",
            stop,
        )
        payload_retry = _build_payload(messages, max_tokens=max_tokens, stop=None)
        res = await client.post(
            f"{llm_base(choice)}/v1/chat/completions",
            json=payload_retry,
        )
        res.raise_for_status()
        data = res.json()
        choices = data.get("choices") or []
        if choices:
            content = _extract_assistant_text(choices[0])
    if not content.strip():
        finish = (choices[0] if choices else {}).get("finish_reason")
        raise httpx.HTTPError(f"LLM returned empty content (finish_reason={finish!r})")
    return content.strip()


async def complete(
    choice: LlmChoice,
    user_message: str,
    system_prompt: str | None,
    *,
    chat_history: list[dict[str, str]] | None = None,
    max_tokens: int | None = None,
    stop: list[str] | None = None,
) -> str:
    messages: list[dict[str, str]] = []
    if system_prompt and system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt.strip()})
    if chat_history:
        messages.extend(chat_history)
    messages.append({"role": "user", "content": user_message})
    return await complete_messages(
        choice, messages, max_tokens=max_tokens, stop=stop
    )


def _extract_assistant_text(choice: dict[str, Any]) -> str:
    msg = choice.get("message") or {}
    for key in ("content", "text"):
        val = msg.get(key)
        if val is not None and str(val).strip():
            return str(val)
    text = choice.get("text")
    if text is not None and str(text).strip():
        return str(text)
    return ""


async def complete_chat(
    choice: LlmChoice,
    user_message: str,
    system_prompt: str | None,
    *,
    chat_history: list[dict[str, str]] | None = None,
    max_tokens: int | None = None,
) -> str:
    return await complete(
        choice,
        user_message,
        system_prompt,
        chat_history=chat_history,
        max_tokens=max_tokens,
        stop=CHAT_STOP,
    )


async def complete_fast(
    choice: LlmChoice,
    user_message: str,
    system_prompt: str | None,
    *,
    chat_history: list[dict[str, str]] | None = None,
    max_tokens: int | None = None,
) -> str:
    """Minimal wrapper: no stop sequences, lower token cap — best latency on llama-server."""
    cap = max_tokens if max_tokens is not None else _int_env("AI_FAST_MAX_TOKENS", 128)
    return await complete(
        choice,
        user_message,
        system_prompt,
        chat_history=chat_history,
        max_tokens=cap,
        stop=None,
    )


async def complete_messages_fast(
    choice: LlmChoice,
    messages: list[dict[str, str]],
    *,
    max_tokens: int | None = None,
) -> str:
    cap = max_tokens if max_tokens is not None else _int_env("AI_FAST_MAX_TOKENS", 128)
    return await complete_messages(choice, messages, max_tokens=cap, stop=None)


async def chat_completions(
    choice: LlmChoice,
    messages: list[dict[str, str]],
    *,
    max_tokens: int | None = None,
    stop: list[str] | None = CHAT_STOP,
    fast: bool = False,
) -> dict[str, Any]:
    """Raw OpenAI-compatible response from llama-server plus request timing."""
    if fast:
        stop = None
        if max_tokens is None:
            max_tokens = _int_env("AI_FAST_MAX_TOKENS", 128)
    payload = _build_payload(messages, max_tokens=max_tokens, stop=stop)
    t0 = time.perf_counter()
    client = get_http_client()
    res = await client.post(
        f"{llm_base(choice)}/v1/chat/completions",
        json=payload,
    )
    res.raise_for_status()
    data = res.json()
    latency_ms = (time.perf_counter() - t0) * 1000.0
    return {"data": data, "latency_ms": latency_ms}
