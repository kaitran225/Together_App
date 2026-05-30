package app.together.common.ai.api;

/**
 * Response from POST /api/v1/internal/ai/chat.
 */
public record ChatResponse(String reply, boolean stub) {
}
