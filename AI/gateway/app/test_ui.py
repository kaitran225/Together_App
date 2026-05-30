"""Simple browser UI for manual gateway / LLM testing."""
from pathlib import Path

from fastapi.responses import FileResponse, RedirectResponse

_STATIC = Path(__file__).resolve().parent.parent / "static"
_INDEX = _STATIC / "index.html"


def register_test_ui(app) -> None:
    @app.get("/", include_in_schema=False)
    @app.get("/test", include_in_schema=False)
    async def test_ui_page():
        if _INDEX.is_file():
            return FileResponse(_INDEX)
        return RedirectResponse(url="/docs")
