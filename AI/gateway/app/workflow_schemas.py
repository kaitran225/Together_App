"""Tool JSON shapes from Together_Workflow.pdf (Tool Agent → Apply)."""
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ActionType(str, Enum):
    CREATION = "CREATION"
    SUMMARIZE = "SUMMARIZE"
    CHAT = "CHAT"
    SEARCH = "SEARCH"


class ToolType(str, Enum):
    CREATE_QUIZ = "CREATE_QUIZ"
    CREATE_FLASHCARD = "CREATE_FLASHCARD"
    CREATE_MINDMAP = "CREATE_MINDMAP"
    CREATE_EVENT = "CREATE_EVENT"
    MESSAGE_SUMMARIZE = "MESSAGE_SUMMARIZE"


class QuizQuestionTool(BaseModel):
    question: str
    options: list[str] = Field(min_length=2)
    correctIndex: int = Field(ge=0)


class CreateQuizPayload(BaseModel):
    tool: str = ToolType.CREATE_QUIZ.value
    quiz: dict[str, Any]


class FlashcardItem(BaseModel):
    front: str
    back: str


class CreateFlashcardPayload(BaseModel):
    tool: str = ToolType.CREATE_FLASHCARD.value
    deckTitle: str | None = None
    cards: list[FlashcardItem] = Field(min_length=1)


class CreateMindmapPayload(BaseModel):
    tool: str = ToolType.CREATE_MINDMAP.value
    mindmap: dict[str, Any]


class CreateEventPayload(BaseModel):
    tool: str = ToolType.CREATE_EVENT.value
    event: dict[str, Any]


class MessageSummarizePayload(BaseModel):
    tool: str = ToolType.MESSAGE_SUMMARIZE.value
    summary: dict[str, str]


class SearchPayload(BaseModel):
    tool: str = "SEARCH"
    query: str
    hints: list[str] = Field(default_factory=list)


ACTION_TOOL_MAP: dict[ActionType, list[ToolType]] = {
    ActionType.CREATION: [
        ToolType.CREATE_QUIZ,
        ToolType.CREATE_FLASHCARD,
        ToolType.CREATE_MINDMAP,
        ToolType.CREATE_EVENT,
    ],
    ActionType.SUMMARIZE: [ToolType.MESSAGE_SUMMARIZE],
    ActionType.CHAT: [],
    ActionType.SEARCH: [],
}
