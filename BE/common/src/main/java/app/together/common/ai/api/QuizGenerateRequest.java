package app.together.common.ai.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload for POST /api/v1/internal/ai/quiz/generate.
 */
public record QuizGenerateRequest(
        @NotBlank String topic,
        @Min(1) @Max(20) int count) {
}
