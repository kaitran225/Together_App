"""Persist applied artifacts via Workflow internal API."""
from __future__ import annotations

import os
from typing import Any

import httpx

WORKFLOW_BASE = os.getenv("WORKFLOW_SERVICE_BASE_URL", "").rstrip("/")
WORKFLOW_KEY = os.getenv("WORKFLOW_SERVICE_INTERNAL_API_KEY", "")


def is_configured() -> bool:
    return bool(WORKFLOW_BASE and WORKFLOW_KEY)


async def persist_applied(artifact: dict[str, Any]) -> dict[str, Any]:
    if not is_configured():
        return {"persisted": False, "reason": "WORKFLOW_SERVICE_BASE_URL not configured"}

    url = f"{WORKFLOW_BASE}/api/v1/internal/ai-tools/apply"
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            url,
            json=artifact,
            headers={"X-Internal-Api-Key": WORKFLOW_KEY},
        )
        res.raise_for_status()
        return res.json()
