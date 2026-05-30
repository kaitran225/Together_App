package app.together.common.ai.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** LLM Tool Agent request (aligns with AI gateway POST /api/v1/internal/ai/agent). */
public record AiAgentRequest(
        @NotBlank String message,
        @NotNull AiActionType actionType,
        AiToolType tool,
        AiContextDto context,
        String llm,
        @NotBlank String userSso,
        Long documentId,
        boolean apply,
        boolean persist) {
}
