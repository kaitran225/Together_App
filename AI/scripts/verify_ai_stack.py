#!/usr/bin/env python3
"""Sanity check: templates, validate, apply — no LLM/Docker required."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "gateway"))

from app.template_loader import load_by_tool_name, load_index  # noqa: E402
from app.tool_applier import apply_tool  # noqa: E402
from app.tool_validator import parse_and_validate  # noqa: E402

ERRORS: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    status = "OK" if ok else "FAIL"
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        ERRORS.append(f"{name}: {detail}")


def main() -> int:
    print("AI stack verification\n")

    print("1. Templates")
    index = load_index()
    check("index.json tools", len(index.get("tools", [])) == 6, f"count={len(index.get('tools', []))}")
    for entry in index.get("tools", []):
        tool = entry["tool"]
        try:
            meta = load_by_tool_name(tool)
            check(
                f"template {tool}",
                "template" in meta and "example" in meta and "llmInstructions" in meta,
            )
            # Round-trip: example should validate
            example = json.dumps(meta["example"])
            tool_name, _, _ = parse_and_validate(example)
            check(f"validate example {tool}", tool_name == tool)
        except Exception as e:
            check(f"template {tool}", False, str(e))

    print("\n2. Apply (workflow-shaped payloads)")
    cases = [
        ("CREATE_QUIZ", load_by_tool_name("CREATE_QUIZ")["example"]),
        ("CREATE_FLASHCARD", load_by_tool_name("CREATE_FLASHCARD")["example"]),
        ("CREATE_MINDMAP", load_by_tool_name("CREATE_MINDMAP")["example"]),
        ("CREATE_EVENT", load_by_tool_name("CREATE_EVENT")["example"]),
        ("MESSAGE_SUMMARIZE", load_by_tool_name("MESSAGE_SUMMARIZE")["example"]),
        ("SEARCH", load_by_tool_name("SEARCH")["example"]),
    ]
    for tool, payload in cases:
        try:
            a = apply_tool(payload, user_sso="verify-user", document_id=1, llm="smol")
            check(
                f"apply {tool}",
                a.applied or tool == "SEARCH",
                f"artifact={a.artifact_type}",
            )
            if tool == "CREATE_QUIZ":
                check("quiz questions", len(a.payload.get("questions", [])) > 0)
            if tool == "CREATE_FLASHCARD":
                check("flashcard deck", "flashcardDefaults" in a.payload)
        except Exception as e:
            check(f"apply {tool}", False, str(e))

    print("\n3. Workflow PDF API surface (gateway routes)")
    from app.main import app  # noqa: E402

    paths = {getattr(r, "path", None) for r in app.routes}
    required = {
        "/api/v1/internal/ai/actions",
        "/api/v1/internal/ai/message",
        "/api/v1/internal/ai/message/attachments",
        "/api/v1/internal/ai/agent",
        "/api/v1/internal/ai/apply",
        "/api/v1/internal/ai/calendar/events",
        "/api/v1/internal/ai/templates",
    }
    for p in sorted(required):
        check(f"route {p}", p in paths)
    check("openapi.json", "/openapi.json" in paths)
    check("swagger /docs", "/docs" in paths)

    schema = app.openapi()
    check("security InternalApiKey", "InternalApiKey" in schema.get("components", {}).get("securitySchemes", {}))

    print()
    if ERRORS:
        print(f"FAILED ({len(ERRORS)} issues):")
        for e in ERRORS:
            print(f"  - {e}")
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
