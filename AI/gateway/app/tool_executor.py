"""Tool Executioner — LLM Tool Agent with validate + retry (Together_Workflow.pdf)."""
from typing import Any

import httpx

from app.llm_client import LlmChoice, complete
from app.prompt_builder import build_agent_system, build_chat_system, build_context_block
from app.tool_applier import AppliedArtifact, apply_tool
from app.tool_validator import MAX_RETRIES, parse_and_validate
from app.workflow_schemas import ActionType, ToolType


async def run_chat(
    message: str,
    *,
    llm: LlmChoice,
    personality: str | None,
    document_tokens: list[str] | None,
    calendar_json: Any | None,
    user_behavior: Any | None,
    chat_history: list[dict[str, str]] | None = None,
    attachment_excerpts: list[str] | None = None,
) -> dict[str, Any]:
    tokens = list(document_tokens or [])
    if attachment_excerpts:
        tokens.extend(attachment_excerpts)
    ctx = build_context_block(tokens, calendar_json, user_behavior)
    system = build_chat_system(personality, ctx)
    reply = await complete(llm, message, system, chat_history=chat_history)
    return {
        "actionType": ActionType.CHAT.value,
        "valid": True,
        "chatReply": reply,
        "toolJson": None,
        "retryCount": 0,
    }


async def run_agent(
    message: str,
    action: ActionType,
    *,
    llm: LlmChoice,
    tool_hint: ToolType | None,
    personality: str | None,
    document_tokens: list[str] | None,
    calendar_json: Any | None,
    user_behavior: Any | None,
    chat_history: list[dict[str, str]] | None = None,
    user_sso: str | None = None,
    document_id: int | None = None,
    do_apply: bool = False,
) -> dict[str, Any]:
    if action == ActionType.CHAT:
        return await run_chat(
            message,
            llm=llm,
            personality=personality,
            document_tokens=document_tokens,
            calendar_json=calendar_json,
            user_behavior=user_behavior,
            chat_history=chat_history,
        )

    ctx = build_context_block(document_tokens, calendar_json, user_behavior)
    system = build_agent_system(action, tool_hint, personality, ctx)
    retry_count = 0
    last_errors: list[str] = []
    prompt = message

    while retry_count <= MAX_RETRIES:
        raw = await complete(llm, prompt, system)
        try:
            tool_name, payload, _ = parse_and_validate(raw)
            result: dict[str, Any] = {
                "actionType": action.value,
                "toolType": tool_name,
                "valid": True,
                "toolJson": payload,
                "chatReply": None,
                "retryCount": retry_count,
            }
            if do_apply and user_sso:
                applied = apply_tool(
                    payload,
                    user_sso=user_sso,
                    document_id=document_id,
                    llm=llm.value,
                )
                result["appliedArtifact"] = {
                    "artifactType": applied.artifact_type,
                    "tool": applied.tool,
                    "payload": applied.payload,
                    "applied": applied.applied,
                    "notes": applied.notes,
                }
            return result
        except Exception as e:
            last_errors.append(str(e))
            retry_count += 1
            prompt = (
                f"{message}\n\nPrevious output was invalid: {last_errors[-1]}. "
                "Return ONLY corrected JSON."
            )

    # Fallback stub tool json so workflow can still Apply in dev
    stub = _stub_tool(action, tool_hint, message)
    result = {
        "actionType": action.value,
        "toolType": stub.get("tool"),
        "valid": False,
        "toolJson": stub,
        "chatReply": None,
        "retryCount": retry_count,
        "errors": last_errors,
    }
    if do_apply and user_sso:
        applied = apply_tool(
            stub,
            user_sso=user_sso,
            document_id=document_id,
            llm=llm.value,
        )
        result["appliedArtifact"] = {
            "artifactType": applied.artifact_type,
            "tool": applied.tool,
            "payload": applied.payload,
            "applied": applied.applied,
            "notes": applied.notes + ["Used stub tool JSON after validation failures"],
        }
    return result


def _stub_tool(action: ActionType, tool: ToolType | None, message: str) -> dict[str, Any]:
    if action == ActionType.SEARCH:
        return {"tool": "SEARCH", "query": message[:100], "hints": ["review course notes"]}
    if action == ActionType.SUMMARIZE or tool == ToolType.MESSAGE_SUMMARIZE:
        return {
            "tool": "MESSAGE_SUMMARIZE",
            "summary": {"content": f"Stub summary: {message[:200]}", "summaryType": "brief"},
        }
    if tool == ToolType.CREATE_QUIZ:
        return {
            "tool": "CREATE_QUIZ",
            "quiz": {
                "title": "Stub quiz",
                "description": message[:100],
                "questions": [
                    {
                        "question": "Stub question?",
                        "options": ["True", "False"],
                        "correctIndex": 0,
                    }
                ],
            },
        }
    if tool == ToolType.CREATE_FLASHCARD:
        return {
            "tool": "CREATE_FLASHCARD",
            "deckTitle": "Stub deck",
            "cards": [{"front": "term", "back": "definition"}],
        }
    if tool == ToolType.CREATE_MINDMAP:
        return {
            "tool": "CREATE_MINDMAP",
            "mindmap": {"title": "Stub map", "content": f"- {message[:80]}"},
        }
    if tool == ToolType.CREATE_EVENT:
        return {
            "tool": "CREATE_EVENT",
            "event": {
                "title": "Study session",
                "description": message[:120],
                "startTime": "2026-01-01T09:00:00Z",
                "endTime": "2026-01-01T10:00:00Z",
                "location": "",
            },
        }
    return {"tool": "SEARCH", "query": message[:100], "hints": []}


async def suggest_events_from_calendar(
    calendar_json: Any,
    *,
    llm: LlmChoice,
    message: str | None,
    user_sso: str,
    do_apply: bool = True,
) -> dict[str, Any]:
    """getEventList(Object calendar) — AI suggests study events from calendar context."""
    prompt = message or "Suggest one study event based on the user's calendar."
    result = await run_agent(
        prompt,
        ActionType.CREATION,
        llm=llm,
        tool_hint=ToolType.CREATE_EVENT,
        personality=None,
        document_tokens=None,
        calendar_json=calendar_json,
        user_behavior=None,
        user_sso=user_sso,
        do_apply=do_apply,
    )
    events: list[dict[str, Any]] = []
    applied = result.get("appliedArtifact")
    if applied and applied.get("payload", {}).get("schedule"):
        events.append(applied["payload"]["schedule"])
    elif result.get("toolJson") and result["toolJson"].get("tool") == "CREATE_EVENT":
        events.append(result["toolJson"]["event"])
    return {"events": events, "agent": result}
