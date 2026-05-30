import os
from enum import Enum

import httpx


class LlmChoice(str, Enum):
    smol = "smol"
    qwen = "qwen"


SMOL_URL = os.getenv("LLM_SMOL_URL", "http://llm-smol:8080").rstrip("/")
QWEN_URL = os.getenv("LLM_QWEN_URL", "http://llm-qwen:8080").rstrip("/")
DEFAULT_LLM = os.getenv("AI_DEFAULT_LLM", "smol").lower()

MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "512"))
TEMPERATURE = float(os.getenv("AI_TEMPERATURE", "0.7"))
TOP_P = float(os.getenv("AI_TOP_P", "0.9"))
TOP_K = int(os.getenv("AI_TOP_K", "40"))
REPEAT_PENALTY = float(os.getenv("AI_REPEAT_PENALTY", "1.15"))
FREQUENCY_PENALTY = float(os.getenv("AI_FREQUENCY_PENALTY", "0.1"))

# Plain chat only — stops JSON loops on small instruct models
CHAT_STOP = ["", "<|endoftext|>", "\n\nUser:", "\n\nHuman:"]


def resolve_llm(choice: LlmChoice | None) -> LlmChoice:
    if choice is not None:
        return choice
    try:
        return LlmChoice(DEFAULT_LLM)
    except ValueError:
        return LlmChoice.smol


def llm_base(choice: LlmChoice) -> str:
    return SMOL_URL if choice == LlmChoice.smol else QWEN_URL


def _build_payload(
    messages: list[dict[str, str]],
    *,
    max_tokens: int | None,
    stop: list[str] | None,
) -> dict:
    payload: dict = {
        "messages": messages,
        "temperature": TEMPERATURE,
        "top_p": TOP_P,
        "top_k": TOP_K,
        "repeat_penalty": REPEAT_PENALTY,
        "frequency_penalty": FREQUENCY_PENALTY,
        "stream": False,
    }
    cap = max_tokens if max_tokens is not None else MAX_TOKENS
    if cap > 0:
        payload["max_tokens"] = cap
    if stop:
        payload["stop"] = stop
    return payload


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
