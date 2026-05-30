package app.together.common.ai.api;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/** Json Response Builder output — chat and/or validated tool JSON */
public record AiMessageResponse(
        String actionType,
        String chatReply,
        String toolType,
        JsonNode toolJson,
        boolean valid,
        int retryCount,
        String llm,
        List<String> errors) {
}
