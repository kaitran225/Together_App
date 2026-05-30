"""OpenAPI / Swagger configuration for Together AI Service."""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

OPENAPI_TAGS: list[dict[str, str]] = [
    {
        "name": "Health",
        "description": "Liveness and LLM backend connectivity (Render health checks).",
    },
    {
        "name": "Templates",
        "description": "JSON templates the LLM Tool Agent must follow (`AI/templates/`).",
    },
    {
        "name": "Actions",
        "description": "Workflow `actionList()` — ACTION_TYPE and tool catalog.",
    },
    {
        "name": "Chat",
        "description": "LLM Chatbox — `getMessage` and attachments (CHAT).",
    },
    {
        "name": "Tool Agent",
        "description": "Generate, validate, apply tool JSON (CREATION, SUMMARIZE, SEARCH).",
    },
    {
        "name": "Apply",
        "description": "Apply validated tool JSON; optional persist to Workflow DB.",
    },
    {
        "name": "Calendar",
        "description": "Workflow `getEventList(calendar)`.",
    },
    {
        "name": "Legacy",
        "description": "Backward-compatible chat and quiz endpoints.",
    },
]

API_DESCRIPTION = """
Together **AI Service** (Python / FastAPI).

Matches `.guide/Together_Workflow.pdf`:

- **LLM Chatbox** — conversational tutor (`CHAT`)
- **LLM Tool Agent** — JSON templates → validate → retry → **Apply**
- **Tool types** — `CREATE_QUIZ`, `CREATE_FLASHCARD`, `CREATE_MINDMAP`, `CREATE_EVENT`, `MESSAGE_SUMMARIZE`, `SEARCH`

## Auth

Internal routes require header **`X-Internal-Api-Key`** (same as other Together microservices).

## LLM backends

Routes to **llm-smol** and **llm-qwen** (llama.cpp OpenAI-compatible API).

## Swagger UI

- `/docs` — Swagger UI (this page)
- `/redoc` — ReDoc
- `/openapi.json` — OpenAPI 3 schema
"""


def create_app() -> FastAPI:
    return FastAPI(
        title="Together AI Service",
        version="2.0",
        description=API_DESCRIPTION,
        openapi_tags=OPENAPI_TAGS,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        contact={"name": "Together App", "email": "together@app.com", "url": "https://together-app.com"},
        license_info={"name": "Proprietary"},
    )


def attach_openapi(app: FastAPI) -> None:
    """Register global security scheme for internal API key."""

    def custom_openapi() -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema

        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
            tags=app.openapi_tags,
        )
        schema.setdefault("components", {}).setdefault("securitySchemes", {})[
            "InternalApiKey"
        ] = {
            "type": "apiKey",
            "in": "header",
            "name": "X-Internal-Api-Key",
            "description": "Shared secret for service-to-service calls (Workflow → AI).",
        }

        for path, path_item in schema.get("paths", {}).items():
            if "/internal/" not in path:
                continue
            for operation in path_item.values():
                if isinstance(operation, dict):
                    operation["security"] = [{"InternalApiKey": []}]

        app.openapi_schema = schema
        return schema

    app.openapi = custom_openapi  # type: ignore[method-assign]
