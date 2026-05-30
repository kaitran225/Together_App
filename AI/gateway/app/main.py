"""
Together AI Service — matches .guide/Together_Workflow.pdf

FE: LLM Chatbox + LLM Tool Agent (JSON templates → validate → apply)
BE: getMessage, getMessage+attachments, actionList, getEventList; Tool Executioner + Prompt Builder
"""
import logging
import os
import time
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)

import httpx
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.llm_client import (
    LlmChoice,
    chat_mode,
    get_qwen_url,
    get_smol_url,
    llm_env_configured,
    log_llm_url_config,
    resolve_llm,
    using_compose_default_urls,
)
from app.chat_history_util import coerce_message_field, sanitize_history_turns
from app.llm_http import close_http_client
from app.openapi_config import attach_openapi, create_app
from app.template_loader import load_by_tool_name, load_index
from app.tool_applier import apply_tool
from app.metrics_util import build_metrics
from app.tool_executor import run_agent, run_chat, run_chat_fast, suggest_events_from_calendar
from app.workflow_apply_client import is_configured, persist_applied
from app.test_ui import register_test_ui
from app.workflow_schemas import ACTION_TOOL_MAP, ActionType, ToolType

app = create_app()
attach_openapi(app)
register_test_ui(app)


@app.on_event("startup")
def _log_startup_config() -> None:
    log_llm_url_config()
    logger.info("AI_CHAT_MODE=%s (fast = lite prompt, 128 tok cap)", chat_mode())


@app.on_event("shutdown")
async def _shutdown_http() -> None:
    await close_http_client()

INTERNAL_KEY = os.getenv("AI_SERVICE_INTERNAL_API_KEY", "")


# --- Request / response models (Feign-aligned) ---


class AttachmentRef(BaseModel):
    name: str
    content_type: str | None = None
    text_excerpt: str = Field(min_length=1)


class ChatTurn(BaseModel):
    role: str = Field(pattern=r"^(system|user|assistant)$")
    content: str = Field(min_length=1)


class LegacyQueryPayload(BaseModel):
    """Some deployed gateways expect { query: { body: \"...\" } }."""

    body: str = Field(min_length=1)


class AiContext(BaseModel):
    """Matches Java `AiContextDto` (camelCase JSON from FE / Feign)."""

    model_config = ConfigDict(populate_by_name=True)

    personality: str | None = None
    document_tokens: list[str] | None = Field(default=None, alias="documentTokens")
    calendar: Any | None = None
    user_behavior: Any | None = Field(default=None, alias="userBehavior")
    chat_history: list[ChatTurn] | None = Field(default=None, alias="chatHistory")

    @field_validator("chat_history", mode="before")
    @classmethod
    def _clean_chat_history(cls, v: Any) -> Any:
        cleaned = sanitize_history_turns(v)
        return cleaned


class MessageRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    message: str = Field(min_length=1)
    query: LegacyQueryPayload | None = None
    context: AiContext | None = None
    llm: LlmChoice | None = None

    @model_validator(mode="before")
    @classmethod
    def _message_or_query(cls, data: Any) -> Any:
        return coerce_message_field(data)


class FastChatRequest(BaseModel):
    """Minimal chat — no tool agent; use for lowest latency from Java / mobile."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    message: str = Field(min_length=1)
    query: LegacyQueryPayload | None = None
    llm: LlmChoice | None = None
    chat_history: list[ChatTurn] | None = Field(default=None, alias="chatHistory")
    max_tokens: int | None = Field(default=None, ge=16, le=2048)
    system: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _message_or_query(cls, data: Any) -> Any:
        return coerce_message_field(data)

    @field_validator("chat_history", mode="before")
    @classmethod
    def _clean_chat_history(cls, v: Any) -> Any:
        return sanitize_history_turns(v)


class MessageWithAttachmentsRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str = Field(min_length=1)
    attachments: list[AttachmentRef] = Field(min_length=1)
    context: AiContext | None = None
    llm: LlmChoice | None = None

    @model_validator(mode="before")
    @classmethod
    def _message_or_query(cls, data: Any) -> Any:
        return coerce_message_field(data)


class AgentRequest(BaseModel):
    message: str = Field(min_length=1)
    action_type: ActionType = ActionType.CREATION
    tool: ToolType | None = None
    context: AiContext | None = None
    llm: LlmChoice | None = None
    user_sso: str = Field(min_length=1)
    document_id: int | None = None
    apply: bool = True
    persist: bool = False


class ApplyToolRequest(BaseModel):
    user_sso: str = Field(min_length=1)
    document_id: int | None = None
    tool_type: str = Field(min_length=1)
    tool_json: dict[str, Any]
    llm: str | None = None
    persist: bool = True


class CalendarEventsRequest(BaseModel):
    calendar: Any
    message: str | None = None
    llm: LlmChoice | None = None
    user_sso: str = Field(min_length=1)
    apply: bool = True


class AppliedArtifactResponse(BaseModel):
    artifactType: str
    tool: str
    payload: dict[str, Any]
    applied: bool = True
    notes: list[str] = Field(default_factory=list)


class RequestMetrics(BaseModel):
    latency_ms: float
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    tokens_per_second: float | None = None
    rating: str


class FastChatResponse(BaseModel):
    reply: str
    llm: str
    metrics: RequestMetrics | None = None


class AiMessageResponse(BaseModel):
    actionType: str
    chatReply: str | None = None
    toolType: str | None = None
    toolJson: dict[str, Any] | None = None
    appliedArtifact: AppliedArtifactResponse | None = None
    persisted: dict[str, Any] | None = None
    valid: bool = True
    retryCount: int = 0
    llm: str
    errors: list[str] | None = None
    metrics: RequestMetrics | None = None


class ApplyToolResponse(BaseModel):
    appliedArtifact: AppliedArtifactResponse
    persisted: dict[str, Any] | None = None


class ActionDescriptor(BaseModel):
    actionType: str
    description: str
    tools: list[str]


class ActionListResponse(BaseModel):
    actions: list[ActionDescriptor]


class CalendarEventsResponse(BaseModel):
    events: list[dict[str, Any]]
    agent: dict[str, Any]


# --- Legacy aliases ---


class ChatRequest(MessageRequest):
    system_prompt: str | None = None


class ChatResponse(BaseModel):
    reply: str
    llm: str
    stub: bool = False


class QuizGenerateRequest(BaseModel):
    topic: str = Field(min_length=1)
    count: int = Field(default=5, ge=1, le=20)
    llm: LlmChoice | None = None
    user_sso: str = "dev-user"
    document_id: int | None = None
    apply: bool = True


class QuizQuestion(BaseModel):
    id: int
    question: str
    options: list[str]
    correctIndex: int


class QuizGenerateResponse(BaseModel):
    questions: list[QuizQuestion]
    llm: str
    stub: bool = False


def _require_internal_key(x_internal_api_key: str | None) -> None:
    if not INTERNAL_KEY.strip():
        raise HTTPException(status_code=503, detail="AI_SERVICE_INTERNAL_API_KEY not configured")
    if x_internal_api_key != INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Invalid internal API key")


def _ctx(
    ctx: AiContext | None,
) -> tuple[str | None, list[str] | None, Any | None, Any | None, list[dict[str, str]] | None]:
    if not ctx:
        return None, None, None, None, None
    history = (
        [{"role": t.role, "content": t.content} for t in ctx.chat_history]
        if ctx.chat_history
        else None
    )
    return ctx.personality, ctx.document_tokens, ctx.calendar, ctx.user_behavior, history


def _applied_from_result(result: dict[str, Any]) -> AppliedArtifactResponse | None:
    raw = result.get("appliedArtifact")
    if not raw:
        return None
    return AppliedArtifactResponse(**raw)


async def _enrich_response(
    result: dict[str, Any],
    llm: str,
    *,
    persist: bool,
    user_sso: str | None = None,
    document_id: int | None = None,
) -> AiMessageResponse:
    applied = _applied_from_result(result)
    persisted = None
    if persist and applied and user_sso:
        if applied.artifact_type == "SEARCH":
            persisted = {"persisted": False, "reason": "SEARCH is not stored in workflow DB"}
        elif applied.tool == "SEARCH":
            persisted = {"persisted": False, "reason": "SEARCH is not stored in workflow DB"}
        else:
            try:
                persisted = await persist_applied(
                    {
                        "userSso": user_sso,
                        "documentId": document_id,
                        "artifactType": applied.artifact_type,
                        "tool": applied.tool,
                        "payload": applied.payload,
                    }
                )
            except httpx.HTTPError as e:
                persisted = {"persisted": False, "error": str(e)}
    return AiMessageResponse(
        actionType=result.get("actionType", ActionType.CHAT.value),
        chatReply=result.get("chatReply"),
        toolType=result.get("toolType"),
        toolJson=result.get("toolJson"),
        appliedArtifact=applied,
        persisted=persisted,
        valid=result.get("valid", True),
        retryCount=result.get("retryCount", 0),
        llm=llm,
        errors=result.get("errors"),
    )


def _to_message_response(
    result: dict[str, Any],
    llm: str,
    *,
    latency_ms: float | None = None,
) -> AiMessageResponse:
    metrics: RequestMetrics | None = None
    if latency_ms is not None:
        raw = build_metrics(latency_ms)
        metrics = RequestMetrics(**raw)
    return AiMessageResponse(
        actionType=result.get("actionType", ActionType.CHAT.value),
        chatReply=result.get("chatReply"),
        toolType=result.get("toolType"),
        toolJson=result.get("toolJson"),
        appliedArtifact=_applied_from_result(result),
        persisted=result.get("persisted"),
        valid=result.get("valid", True),
        retryCount=result.get("retryCount", 0),
        llm=llm,
        errors=result.get("errors"),
        metrics=metrics,
    )


@app.get("/health", tags=["Health"])
@app.get("/api/v1/ai/health", tags=["Health"])
async def health() -> dict[str, Any]:
    smol_ok = qwen_ok = False
    smol_err: str | None = None
    qwen_err: str | None = None
    smol_url = get_smol_url()
    qwen_url = get_qwen_url()
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for url, name in ((smol_url, "smol"), (qwen_url, "qwen")):
            try:
                r = await client.get(f"{url}/health")
                if r.is_success:
                    if name == "smol":
                        smol_ok = True
                    else:
                        qwen_ok = True
                else:
                    msg = f"HTTP {r.status_code}"
                    if name == "smol":
                        smol_err = msg
                    else:
                        qwen_err = msg
            except httpx.HTTPError as e:
                msg = str(e) or type(e).__name__
                if name == "smol":
                    smol_err = msg
                else:
                    qwen_err = msg
    hint: str | None = None
    if using_compose_default_urls() or not llm_env_configured():
        hint = (
            "LLM_SMOL_URL and LLM_QWEN_URL are not set on this gateway service. "
            "Render Environment Groups must be linked to dev-together-ai-gateway; "
            "then Manual Deploy. Example: https://dev-together-ai-smol.onrender.com"
        )
    return {
        "status": "UP",
        "service": "ai-service",
        "llm_smol": smol_ok,
        "llm_qwen": qwen_ok,
        "llm_smol_url": smol_url,
        "llm_qwen_url": qwen_url,
        "llm_smol_error": smol_err,
        "llm_qwen_error": qwen_err,
        "llm_env_configured": llm_env_configured(),
        "hint": hint,
    }


@app.get("/swagger-ui/index.html", include_in_schema=False)
async def swagger_ui_compat() -> RedirectResponse:
    """Same path as Spring Boot services (email, workflow)."""
    return RedirectResponse(url="/docs")


@app.get("/swagger-ui.html", include_in_schema=False)
async def swagger_ui_compat_alt() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@app.get("/api/v1/internal/ai/templates", tags=["Templates"])
def list_templates(
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> dict[str, Any]:
    """JSON templates the LLM must follow (AI/templates/*.template.json)."""
    _require_internal_key(x_internal_api_key)
    index = load_index()
    items = []
    for entry in index.get("tools", []):
        meta = load_by_tool_name(entry["tool"])
        items.append(
            {
                "tool": entry["tool"],
                "artifact": entry.get("artifact"),
                "file": entry.get("file"),
                "template": meta.get("template"),
                "example": meta.get("example"),
                "llmInstructions": meta.get("llmInstructions"),
            }
        )
    return {"version": index.get("version"), "tools": items}


@app.get("/api/v1/internal/ai/templates/{tool_name}", tags=["Templates"])
def get_template(
    tool_name: str,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> dict[str, Any]:
    _require_internal_key(x_internal_api_key)
    return load_by_tool_name(tool_name)


@app.get("/api/v1/internal/ai/actions", response_model=ActionListResponse, tags=["Actions"])
def action_list(
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> ActionListResponse:
    """actionList() — available ACTION_TYPE + tools for Tool Agent."""
    _require_internal_key(x_internal_api_key)
    actions = [
        ActionDescriptor(
            actionType=ActionType.CHAT.value,
            description="LLM Chatbox — conversational tutor",
            tools=[],
        ),
        ActionDescriptor(
            actionType=ActionType.CREATION.value,
            description="Tool Agent — Quizlet, Flash Card, Mindmap, Event JSON",
            tools=[t.value for t in ACTION_TOOL_MAP[ActionType.CREATION]],
        ),
        ActionDescriptor(
            actionType=ActionType.SUMMARIZE.value,
            description="Message Summarize",
            tools=[ToolType.MESSAGE_SUMMARIZE.value],
        ),
        ActionDescriptor(
            actionType=ActionType.SEARCH.value,
            description="Study search suggestions",
            tools=["SEARCH"],
        ),
    ]
    return ActionListResponse(actions=actions)


@app.post("/api/v1/internal/ai/message", response_model=AiMessageResponse, tags=["Chat"])
async def get_message(
    body: MessageRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> AiMessageResponse:
    """getMessage(String msg) — CHAT / LLM Chatbox."""
    _require_internal_key(x_internal_api_key)
    choice = resolve_llm(body.llm)
    personality, docs, cal, behavior, history = _ctx(body.context)
    t0 = time.perf_counter()
    try:
        result = await run_chat(
            body.message,
            llm=choice,
            personality=personality,
            document_tokens=docs,
            calendar_json=cal,
            user_behavior=behavior,
            chat_history=history,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    latency_ms = (time.perf_counter() - t0) * 1000.0
    return _to_message_response(result, choice.value, latency_ms=latency_ms)


@app.post("/api/v1/internal/ai/chat/fast", response_model=FastChatResponse, tags=["Chat"])
async def chat_fast(
    body: FastChatRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> FastChatResponse:
    """Thin LLM wrapper (lite prompt, capped history). Prefer over `/message` for chat speed."""
    _require_internal_key(x_internal_api_key)
    choice = resolve_llm(body.llm)
    history = (
        [{"role": t.role, "content": t.content} for t in body.chat_history]
        if body.chat_history
        else None
    )
    t0 = time.perf_counter()
    try:
        result = await run_chat_fast(
            body.message,
            llm=choice,
            personality=None,
            document_tokens=None,
            chat_history=history,
            max_tokens=body.max_tokens,
            system_override=body.system,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    latency_ms = (time.perf_counter() - t0) * 1000.0
    reply = result.get("chatReply") or ""
    if not reply.strip():
        errs = result.get("errors") or ["Empty LLM reply"]
        raise HTTPException(status_code=502, detail="; ".join(errs))
    raw = build_metrics(latency_ms)
    return FastChatResponse(
        reply=reply,
        llm=choice.value,
        metrics=RequestMetrics(**raw),
    )


@app.post(
    "/api/v1/internal/ai/message/attachments",
    response_model=AiMessageResponse,
    tags=["Chat"],
)
async def get_message_with_attachments(
    body: MessageWithAttachmentsRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> AiMessageResponse:
    """getMessage(String msg, List<Attachment> att)."""
    _require_internal_key(x_internal_api_key)
    choice = resolve_llm(body.llm)
    personality, docs, cal, behavior, history = _ctx(body.context)
    excerpts = [f"[{a.name}] {a.text_excerpt}" for a in body.attachments]
    try:
        result = await run_chat(
            body.message,
            llm=choice,
            personality=personality,
            document_tokens=docs,
            calendar_json=cal,
            user_behavior=behavior,
            chat_history=history,
            attachment_excerpts=excerpts,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return _to_message_response(result, choice.value)


@app.post("/api/v1/internal/ai/agent", response_model=AiMessageResponse, tags=["Tool Agent"])
async def tool_agent(
    body: AgentRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> AiMessageResponse:
    """LLM Tool Agent — JSON template, validate, retry, Apply-ready toolJson."""
    _require_internal_key(x_internal_api_key)
    choice = resolve_llm(body.llm)
    personality, docs, cal, behavior, history = _ctx(body.context)
    try:
        result = await run_agent(
            body.message,
            body.action_type,
            llm=choice,
            tool_hint=body.tool,
            personality=personality,
            document_tokens=docs,
            calendar_json=cal,
            user_behavior=behavior,
            chat_history=history,
            user_sso=body.user_sso,
            document_id=body.document_id,
            do_apply=body.apply,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return await _enrich_response(
        result,
        choice.value,
        persist=body.persist,
        user_sso=body.user_sso,
        document_id=body.document_id,
    )


@app.post("/api/v1/internal/ai/apply", response_model=ApplyToolResponse, tags=["Apply"])
async def apply_tool_endpoint(
    body: ApplyToolRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> ApplyToolResponse:
    """Apply validated tool JSON → artifact; optionally persist via Workflow."""
    _require_internal_key(x_internal_api_key)
    try:
        applied = apply_tool(
            body.tool_json,
            user_sso=body.user_sso,
            document_id=body.document_id,
            llm=body.llm,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    artifact = AppliedArtifactResponse(
        artifactType=applied.artifact_type,
        tool=applied.tool,
        payload=applied.payload,
        applied=applied.applied,
        notes=applied.notes,
    )
    persisted = None
    if body.persist and applied.artifact_type == "SEARCH":
        persisted = {"persisted": False, "reason": "SEARCH is not stored in workflow DB"}
    elif body.persist and is_configured():
        try:
            persisted = await persist_applied(
                {
                    "userSso": body.user_sso,
                    "documentId": body.document_id,
                    "artifactType": applied.artifact_type,
                    "tool": applied.tool,
                    "payload": applied.payload,
                }
            )
        except httpx.HTTPError as e:
            persisted = {"persisted": False, "error": str(e)}
    elif body.persist:
        persisted = {"persisted": False, "reason": "WORKFLOW_SERVICE_BASE_URL not configured"}
    return ApplyToolResponse(appliedArtifact=artifact, persisted=persisted)


@app.post("/api/v1/internal/ai/calendar/events", response_model=CalendarEventsResponse, tags=["Calendar"])
async def get_event_list(
    body: CalendarEventsRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> CalendarEventsResponse:
    """getEventList(Object calendar)."""
    _require_internal_key(x_internal_api_key)
    choice = resolve_llm(body.llm)
    try:
        out = await suggest_events_from_calendar(
            body.calendar,
            llm=choice,
            message=body.message,
            user_sso=body.user_sso,
            do_apply=body.apply,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return CalendarEventsResponse(events=out["events"], agent=out["agent"])


# --- Legacy endpoints ---


@app.post("/api/v1/internal/ai/chat", response_model=ChatResponse, tags=["Legacy"])
async def chat_legacy(
    body: ChatRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> ChatResponse:
    _require_internal_key(x_internal_api_key)
    choice = resolve_llm(body.llm)
    personality, docs, cal, behavior, history = _ctx(body.context)
    if body.system_prompt:
        docs = (docs or []) + [body.system_prompt]
    result = await run_chat(
        body.message,
        llm=choice,
        personality=personality,
        document_tokens=docs,
        calendar_json=cal,
        user_behavior=behavior,
        chat_history=history,
    )
    return ChatResponse(reply=result.get("chatReply") or "", llm=choice.value)


@app.post("/api/v1/internal/ai/quiz/generate", response_model=QuizGenerateResponse, tags=["Legacy"])
async def quiz_generate_legacy(
    body: QuizGenerateRequest,
    x_internal_api_key: str | None = Header(default=None, alias="X-Internal-Api-Key"),
) -> QuizGenerateResponse:
    _require_internal_key(x_internal_api_key)
    choice = resolve_llm(body.llm)
    agent = AgentRequest(
        message=f"Create a quiz with {body.count} questions about: {body.topic}",
        action_type=ActionType.CREATION,
        tool=ToolType.CREATE_QUIZ,
        llm=choice,
        user_sso=body.user_sso,
        document_id=body.document_id,
        apply=body.apply,
    )
    res = await tool_agent(agent, x_internal_api_key)
    questions: list[QuizQuestion] = []
    if res.toolJson and res.toolJson.get("quiz"):
        for i, q in enumerate(res.toolJson["quiz"].get("questions", [])[: body.count], start=1):
            opts = q.get("options") or ["True", "False"]
            questions.append(
                QuizQuestion(
                    id=i,
                    question=q.get("question", ""),
                    options=opts,
                    correctIndex=int(q.get("correctIndex", 0)),
                )
            )
    if not questions:
        questions = [
            QuizQuestion(id=1, question=f"Stub about {body.topic}?", options=["True", "False"], correctIndex=0)
        ]
    return QuizGenerateResponse(questions=questions, llm=choice.value, stub=not res.valid)


from app.stream_routes import register_stream_routes

register_stream_routes(
    app,
    require_internal_key=_require_internal_key,
    ctx_from_message=_ctx,
)
