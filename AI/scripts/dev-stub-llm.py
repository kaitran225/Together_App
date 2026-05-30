"""Minimal OpenAI-compatible stub for local dev when Docker / llama.cpp is unavailable."""
import sys
from typing import Any

import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel, Field

LLM_NAME = sys.argv[1] if len(sys.argv) > 1 else "stub"
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8080

app = FastAPI(title=f"stub-{LLM_NAME}")


class Message(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    messages: list[Message]
    max_tokens: int | None = Field(default=None, ge=1)
    temperature: float = 0.7
    stream: bool = False


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "UP", "llm": LLM_NAME, "stub": True, "live": False}


def _stub_tool_json(user: str) -> str:
    import json

    if "quiz" in user.lower():
        return json.dumps(
            {
                "tool": "CREATE_QUIZ",
                "quiz": {
                    "title": "Stub quiz",
                    "description": user[:80],
                    "questions": [
                        {
                            "question": "Stub True/False?",
                            "options": ["True", "False"],
                            "correctIndex": 0,
                        }
                    ],
                },
            }
        )
    if "summar" in user.lower():
        return json.dumps(
            {
                "tool": "MESSAGE_SUMMARIZE",
                "summary": {"content": f"Summary: {user[:120]}", "summaryType": "brief"},
            }
        )
    if "mind" in user.lower() or "map" in user.lower():
        return json.dumps(
            {
                "tool": "CREATE_MINDMAP",
                "mindmap": {"title": "Stub", "content": f"- {user[:60]}"},
            }
        )
    if "event" in user.lower() or "calendar" in user.lower():
        return json.dumps(
            {
                "tool": "CREATE_EVENT",
                "event": {
                    "title": "Study block",
                    "description": user[:80],
                    "startTime": "2026-06-01T09:00:00Z",
                    "endTime": "2026-06-01T10:00:00Z",
                    "location": "",
                },
            }
        )
    if "flash" in user.lower():
        return json.dumps(
            {
                "tool": "CREATE_FLASHCARD",
                "deckTitle": "Stub deck",
                "cards": [{"front": "term", "back": "definition"}],
            }
        )
    return json.dumps({"tool": "SEARCH", "query": user[:80], "hints": ["review notes"]})


@app.post("/v1/chat/completions")
def chat_completions(body: ChatCompletionRequest) -> dict[str, Any]:
    user = next((m.content for m in reversed(body.messages) if m.role == "user"), "")
    system = next((m.content for m in body.messages if m.role == "system"), "")
    if "ONLY" in system and "JSON" in system:
        reply = _stub_tool_json(user)
    else:
        reply = f"[{LLM_NAME} local stub] {user[:500]}"
    return {
        "choices": [{"message": {"role": "assistant", "content": reply}, "finish_reason": "stop"}],
        "model": f"stub-{LLM_NAME}",
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
