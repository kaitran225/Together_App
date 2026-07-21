"""Apply validated tool JSON → workflow-ready artifacts (Together_Workflow.pdf Apply step)."""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.workflow_schemas import ToolType


@dataclass
class AppliedArtifact:
    artifact_type: str
    tool: str
    payload: dict[str, Any]
    applied: bool = True
    notes: list[str] = field(default_factory=list)


def _parse_instant(value: str) -> str:
    if not value or not str(value).strip():
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return str(value).strip()


def _options_json(options: list[str]) -> str:
    return json.dumps(options, ensure_ascii=False)


def apply_tool(
    tool_json: dict[str, Any],
    *,
    user_sso: str,
    document_id: int | None = None,
    llm: str | None = None,
) -> AppliedArtifact:
    tool = str(tool_json.get("tool", ""))

    if tool == ToolType.CREATE_QUIZ.value:
        return _apply_quiz(tool_json, user_sso, document_id)
    if tool == ToolType.CREATE_FLASHCARD.value:
        return _apply_flashcards(tool_json, user_sso, document_id)
    if tool == ToolType.CREATE_MINDMAP.value:
        return _apply_mindmap(tool_json, user_sso, document_id)
    if tool == ToolType.CREATE_EVENT.value:
        return _apply_event(tool_json, user_sso)
    if tool == ToolType.MESSAGE_SUMMARIZE.value:
        return _apply_summary(tool_json, user_sso, document_id, llm)
    if tool == "SEARCH":
        return AppliedArtifact(
            artifact_type="SEARCH",
            tool=tool,
            payload={
                "search": {
                    "query": tool_json.get("query", ""),
                    "hints": tool_json.get("hints") or [],
                    "userSso": user_sso,
                }
            },
        )

    raise ValueError(f"Cannot apply unknown tool: {tool}")


def _apply_quiz(data: dict[str, Any], user_sso: str, document_id: int | None) -> AppliedArtifact:
    quiz = data.get("quiz") or {}
    questions_out: list[dict[str, Any]] = []
    for pos, q in enumerate(quiz.get("questions") or [], start=1):
        options = q.get("options") or ["True", "False"]
        idx = int(q.get("correctIndex", 0))
        idx = max(0, min(idx, len(options) - 1))
        questions_out.append(
            {
                "questionType": "multiple_choice",
                "questionText": q.get("question", ""),
                "options": _options_json(options),
                "correctAnswer": options[idx],
                "explanation": q.get("explanation"),
                "points": 1,
                "position": pos,
            }
        )

    return AppliedArtifact(
        artifact_type="QUIZ",
        tool=ToolType.CREATE_QUIZ.value,
        payload={
            "quiz": {
                "userSso": user_sso,
                "documentId": document_id,
                "title": quiz.get("title") or "AI Quiz",
                "description": quiz.get("description"),
                "difficulty": quiz.get("difficulty", "medium"),
                "timeLimitMinutes": quiz.get("timeLimitMinutes"),
                "passingScore": quiz.get("passingScore"),
                "isRandomized": False,
                "showAnswers": True,
            },
            "questions": questions_out,
        },
    )


def _apply_flashcards(
    data: dict[str, Any], user_sso: str, document_id: int | None
) -> AppliedArtifact:
    title = data.get("deckTitle") or "AI Flashcard deck"
    cards = data.get("cards") or []
    questions_out: list[dict[str, Any]] = []
    flashcards_out: list[dict[str, Any]] = []

    for pos, card in enumerate(cards, start=1):
        front = (card.get("front") or "").strip()
        back = (card.get("back") or "").strip()
        if not front or not back:
            continue
        questions_out.append(
            {
                "questionType": "flashcard",
                "questionText": front,
                "options": _options_json([front, back]),
                "correctAnswer": back,
                "explanation": None,
                "points": 1,
                "position": pos,
            }
        )
        flashcards_out.append(
            {
                "easeFactor": 2.5,
                "interval": 1,
                "repetitions": 0,
                "nextReviewDate": datetime.now(timezone.utc).date().isoformat(),
            }
        )

    return AppliedArtifact(
        artifact_type="FLASHCARD_DECK",
        tool=ToolType.CREATE_FLASHCARD.value,
        payload={
            "quiz": {
                "userSso": user_sso,
                "documentId": document_id,
                "title": title,
                "description": "Generated flashcard deck",
                "difficulty": "easy",
                "showAnswers": True,
            },
            "questions": questions_out,
            "flashcardDefaults": flashcards_out,
        },
        applied=bool(questions_out),
        notes=[] if questions_out else ["No valid cards to apply"],
    )


def _apply_mindmap(data: dict[str, Any], user_sso: str, document_id: int | None) -> AppliedArtifact:
    mind = data.get("mindmap") or {}
    content = mind.get("content", "")
    if isinstance(content, dict):
        content_str = json.dumps(content, ensure_ascii=False)
    else:
        content_str = json.dumps({"markdown": str(content)}, ensure_ascii=False)

    return AppliedArtifact(
        artifact_type="MINDMAP",
        tool=ToolType.CREATE_MINDMAP.value,
        payload={
            "mindmap": {
                "userSso": user_sso,
                "documentId": document_id,
                "title": mind.get("title") or "AI Mindmap",
                "content": content_str,
                "thumbnailUrl": mind.get("thumbnailUrl"),
            }
        },
    )


def _apply_event(data: dict[str, Any], user_sso: str) -> AppliedArtifact:
    ev = data.get("event") or {}
    return AppliedArtifact(
        artifact_type="SCHEDULE",
        tool=ToolType.CREATE_EVENT.value,
        payload={
            "schedule": {
                "userSso": user_sso,
                "title": ev.get("title") or "Study event",
                "description": ev.get("description"),
                "location": ev.get("location"),
                "startTime": _parse_instant(ev.get("startTime", "")),
                "endTime": _parse_instant(ev.get("endTime", "")),
                "isAllDay": bool(ev.get("isAllDay", False)),
                "timezone": ev.get("timezone", "UTC"),
                "status": "scheduled",
                "source": "ai",
            }
        },
    )


def _apply_summary(
    data: dict[str, Any], user_sso: str, document_id: int | None, llm: str | None
) -> AppliedArtifact:
    summary = data.get("summary") or {}
    notes: list[str] = []
    if document_id is None:
        notes.append("documentId required to persist summary in workflow; artifact built only")

    return AppliedArtifact(
        artifact_type="SUMMARY",
        tool=ToolType.MESSAGE_SUMMARIZE.value,
        payload={
            "summary": {
                "documentId": document_id,
                "userSso": user_sso,
                "summaryType": summary.get("summaryType", "brief"),
                "content": summary.get("content", ""),
                "modelUsed": llm,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
            }
        },
        notes=notes,
    )
