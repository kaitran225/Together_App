"""Shared request models for direct llama proxy routes."""
from __future__ import annotations

import os
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.chat_history_util import sanitize_openai_messages
from app.llm_client import LlmChoice


def structure_input_enabled() -> bool:
    return os.getenv("AI_STRUCTURE_INPUT", "true").strip().lower() in ("1", "true", "yes")


class ProxyChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    messages: list[dict[str, Any]] = Field(min_length=1)
    llm: LlmChoice | None = None
    max_tokens: int | None = None
    personality: str | None = None
    document_tokens: list[str] | None = Field(default=None, alias="documentTokens")
    system: str | None = None
    structure: bool | None = None

    @field_validator("messages", mode="before")
    @classmethod
    def _clean_messages(cls, v: Any) -> list[dict[str, str]]:
        return sanitize_openai_messages(v)

    def use_structure(self) -> bool:
        if self.structure is not None:
            return self.structure
        return structure_input_enabled()
