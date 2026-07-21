"""Json Parse → Check and Validate → Failed → Prompt Retry (workflow PDF)."""
import json
import re
from typing import Any

from pydantic import ValidationError

from app.workflow_schemas import (
    CreateEventPayload,
    CreateFlashcardPayload,
    CreateMindmapPayload,
    CreateQuizPayload,
    MessageSummarizePayload,
    SearchPayload,
    ToolType,
)

MAX_RETRIES = 2


def extract_json_object(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("No JSON object in model output")
    return json.loads(text[start : end + 1])


def validate_tool_payload(data: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    tool_name = str(data.get("tool", ""))
    if tool_name == ToolType.CREATE_QUIZ.value:
        CreateQuizPayload.model_validate(data)
    elif tool_name == ToolType.CREATE_FLASHCARD.value:
        CreateFlashcardPayload.model_validate(data)
    elif tool_name == ToolType.CREATE_MINDMAP.value:
        CreateMindmapPayload.model_validate(data)
    elif tool_name == ToolType.CREATE_EVENT.value:
        CreateEventPayload.model_validate(data)
    elif tool_name == ToolType.MESSAGE_SUMMARIZE.value:
        MessageSummarizePayload.model_validate(data)
    elif tool_name == "SEARCH":
        SearchPayload.model_validate(data)
    else:
        raise ValueError(f"Unknown tool: {tool_name}")
    return tool_name, data


def parse_and_validate(raw: str) -> tuple[str, dict[str, Any], list[str]]:
    errors: list[str] = []
    try:
        obj = extract_json_object(raw)
        tool, payload = validate_tool_payload(obj)
        return tool, payload, errors
    except (json.JSONDecodeError, ValidationError, ValueError) as e:
        errors.append(str(e))
        raise ValueError(errors[-1]) from e
