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


def resolve_llm(choice: LlmChoice | None) -> LlmChoice:
    if choice is not None:
        return choice
    try:
        return LlmChoice(DEFAULT_LLM)
    except ValueError:
        return LlmChoice.smol


def llm_base(choice: LlmChoice) -> str:
    return SMOL_URL if choice == LlmChoice.smol else QWEN_URL


async def complete(
    choice: LlmChoice,
    user_message: str,
    system_prompt: str | None,
    *,
    max_tokens: int | None = None,
) -> str:
    messages: list[dict[str, str]] = []
    if system_prompt and system_prompt.strip():
        messages.append({"role": "system", "content": system_prompt.strip()})
    messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(
            f"{llm_base(choice)}/v1/chat/completions",
            json={
                "messages": messages,
                "max_tokens": max_tokens or MAX_TOKENS,
                "temperature": 0.3,
                "stream": False,
            },
        )
        res.raise_for_status()
        data = res.json()

    choices = data.get("choices") or []
    if not choices:
        raise httpx.HTTPError("Empty LLM response")
    return (choices[0].get("message", {}).get("content") or "").strip()
