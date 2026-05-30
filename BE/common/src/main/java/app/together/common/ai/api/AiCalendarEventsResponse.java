package app.together.common.ai.api;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

public record AiCalendarEventsResponse(List<JsonNode> events, JsonNode agent) {
}
