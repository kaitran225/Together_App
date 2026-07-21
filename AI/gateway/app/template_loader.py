"""Load LLM JSON templates from AI/templates/*.template.json."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.workflow_schemas import ToolType

_DEFAULT_TEMPLATES = Path(__file__).resolve().parents[2] / "templates"


def _templates_dir() -> Path:
    import os

    override = os.getenv("AI_TEMPLATES_DIR", "").strip()
    if override:
        path = Path(override)
        if path.is_dir():
            return path
    if _DEFAULT_TEMPLATES.is_dir():
        return _DEFAULT_TEMPLATES
    # Docker layout: /app/templates next to /app/app
    fallback = Path(__file__).resolve().parents[1] / "templates"
    return fallback


@lru_cache
def load_index() -> dict[str, Any]:
    path = _templates_dir() / "index.json"
    return json.loads(path.read_text(encoding="utf-8"))


@lru_cache
def load_template_file(filename: str) -> dict[str, Any]:
    path = _templates_dir() / filename
    if not path.is_file():
        raise FileNotFoundError(f"Template not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_by_tool_name(tool_name: str) -> dict[str, Any]:
    index = load_index()
    for entry in index.get("tools", []):
        if entry.get("tool") == tool_name:
            return load_template_file(entry["file"])
    raise KeyError(f"No template file for tool {tool_name}")


def load_by_tool(tool: ToolType) -> dict[str, Any]:
    return load_by_tool_name(tool.value)


def template_json(tool: ToolType) -> dict[str, Any]:
    return load_by_tool(tool).get("template", {})


def example_json(tool: ToolType) -> dict[str, Any]:
    return load_by_tool(tool).get("example", {})


def llm_instructions(tool: ToolType) -> str:
    return load_by_tool(tool).get("llmInstructions", "")


def all_creation_templates() -> list[dict[str, Any]]:
    from app.workflow_schemas import ACTION_TOOL_MAP, ActionType

    return [load_by_tool(t) for t in ACTION_TOOL_MAP[ActionType.CREATION]]
