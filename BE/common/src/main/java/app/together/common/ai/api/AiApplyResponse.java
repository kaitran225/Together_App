package app.together.common.ai.api;

import com.fasterxml.jackson.databind.JsonNode;

/** Result of Apply step (workflow persisted entities). */
public record AiApplyResponse(
        boolean persisted,
        String artifactType,
        JsonNode ids,
        String message) {
}
