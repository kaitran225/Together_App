package app.together.common.ai.api;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload for POST /api/v1/internal/ai/chat (AI microservice).
 */
public record ChatRequest(
        @NotBlank String message,
        String systemPrompt) {
}
