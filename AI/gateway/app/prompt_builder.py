"""Prompt Builder — loads JSON templates from AI/templates/."""
import json
from typing import Any

from app.template_loader import load_by_tool, load_by_tool_name
from app.workflow_schemas import ACTION_TOOL_MAP, ActionType, ToolType


def build_chat_system_lite(personality: str | None, context_block: str) -> str:
    """Short system prompt — fewer prompt tokens, faster on small models."""
    tone = personality.strip() if personality and personality.strip() else "tutor"
    base = (
        f"You are a helpful {tone}. "
        "Reply only to the user's latest message. "
        "Stay on the same topic as the conversation. "
        "Do not change subject or invent a new question. "
        "Use plain text, no JSON."
    )
    if context_block:
        return f"{base}\n\n{context_block}"
    return base


def build_chat_system(personality: str | None, context_block: str) -> str:
    tone = personality.strip() if personality and personality.strip() else "friendly study tutor"
    rules = (
        "You are a helpful AI tutor. Reply in plain conversational text only.\n"
        "Do not use JSON, markdown code fences, or repeat the same sentence.\n"
        "Keep answers concise (1–4 sentences) unless the user asks for detail.\n"
    )
    if context_block:
        return f"{rules}Tone: {tone}.\n\n{context_block}"
    return f"{rules}Tone: {tone}."


def _tool_prompt_block(tool_name: str) -> str:
    meta = load_by_tool_name(tool_name)
    return (
        f"--- {tool_name} ---\n"
        f"{meta['llmInstructions']}\n"
        f"Template:\n{json.dumps(meta['template'], ensure_ascii=False)}\n"
        f"Example:\n{json.dumps(meta['example'], ensure_ascii=False)}"
    )


def build_agent_system(
    action: ActionType,
    tool: ToolType | None,
    personality: str | None,
    context_block: str,
) -> str:
    tone = personality.strip() if personality and personality.strip() else "precise"
    if action == ActionType.CHAT:
        return build_chat_system(personality, context_block)

    if action == ActionType.SEARCH:
        return (
            f"You are a study search assistant ({tone}).\n"
            f"{_tool_prompt_block('SEARCH')}\n{context_block}"
        )

    if action == ActionType.SUMMARIZE:
        return (
            f"You are a summarization agent ({tone}).\n"
            f"{_tool_prompt_block(ToolType.MESSAGE_SUMMARIZE.value)}\n{context_block}"
        )

    tools = [tool] if tool else ACTION_TOOL_MAP[ActionType.CREATION]
    blocks: list[str] = [
        f"You are a Tool Agent ({tone}). Reply with ONLY one valid JSON object. "
        "No markdown, no explanation.",
    ]
    for t in tools:
        blocks.append(_tool_prompt_block(t.value))
    blocks.append(context_block)
    return "\n\n".join(blocks)


def build_context_block(
    document_tokens: list[str] | None,
    calendar_json: Any | None,
    user_behavior: Any | None,
) -> str:
    parts: list[str] = []
    if document_tokens:
        joined = "\n".join(f"- {t}" for t in document_tokens)
        parts.append(f"User document excerpts:\n{joined}")
    if calendar_json is not None:
        parts.append(f"User calendar context:\n{json.dumps(calendar_json, ensure_ascii=False)}")
    if user_behavior is not None:
        parts.append(f"User behavior:\n{json.dumps(user_behavior, ensure_ascii=False)}")
    return "\n\n".join(parts) if parts else ""
