"""Latency ratings for gateway / proxy responses."""


def rate_latency_ms(ms: float) -> str:
    if ms < 2000:
        return "fast"
    if ms < 8000:
        return "ok"
    if ms < 25000:
        return "slow"
    return "very_slow"


def build_metrics(
    latency_ms: float,
    *,
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
) -> dict[str, float | int | str | None]:
    tps: float | None = None
    if completion_tokens and latency_ms > 0:
        tps = round(completion_tokens / (latency_ms / 1000.0), 2)
    total: int | None = None
    if prompt_tokens is not None and completion_tokens is not None:
        total = prompt_tokens + completion_tokens
    return {
        "latency_ms": round(latency_ms, 1),
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total,
        "tokens_per_second": tps,
        "rating": rate_latency_ms(latency_ms),
    }
