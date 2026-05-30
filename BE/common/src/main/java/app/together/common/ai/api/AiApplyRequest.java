package app.together.common.ai.api;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Persist an applied AI artifact in workflow DB. */
public record AiApplyRequest(
        @NotBlank String userSso,
        Long documentId,
        @NotBlank String artifactType,
        @NotBlank String tool,
        @NotNull JsonNode payload) {
}
