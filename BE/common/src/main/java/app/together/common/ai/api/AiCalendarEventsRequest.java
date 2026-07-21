package app.together.common.ai.api;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;

/** getEventList(Object calendar) */
public record AiCalendarEventsRequest(
        @NotNull JsonNode calendar,
        String message,
        String llm) {
}
