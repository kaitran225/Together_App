import logging
import os
from enum import Enum

import httpx

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
) -> dict:
    payload: dict = {
        "messages": messages,
        "temperature": _float_env("AI_TEMPERATURE", 0.7),
        "top_p": _float_env("AI_TOP_P", 0.9),
        "top_k": _int_env("AI_TOP_K", 40),
        "repeat_penalty": _float_env("AI_REPEAT_PENALTY", 1.15),
        "frequency_penalty": _float_env("AI_FREQUENCY_PENALTY", 0.1),
        "stream": False,
    }
    cap = max_tokens if max_tokens is not None else _int_env("AI_MAX_TOKENS", 512)
    if cap > 0:
        payload["max_tokens"] = cap
    if stop:
        payload["stop"] = stop
    return payload


# Plain chat only — stops JSON loops on small instruct models
CHAT_STOP = ["", "<|endoftext|>", "\n\nUser:", "\n\nHuman:"]


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

    payload = _build_payload(messages, max_tokens=max_tokens, stop=stop)

    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(
            f"{llm_base(choice)}/v1/chat/completions",
            json=payload,
        )
        res.raise_for_status()
        data = res.json()

    choices = data.get("choices") or []
    if not choices:
        raise httpx.HTTPError("Empty LLM response")
    return (choices[0].get("message", {}).get("content") or "").strip()


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
