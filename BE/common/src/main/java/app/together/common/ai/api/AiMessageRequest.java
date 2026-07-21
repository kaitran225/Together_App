package app.together.common.ai.api;

import jakarta.validation.constraints.NotBlank;

/** getMessage(String msg) */
public record AiMessageRequest(
        @NotBlank String message,
        AiContextDto context,
        String llm) {
}
