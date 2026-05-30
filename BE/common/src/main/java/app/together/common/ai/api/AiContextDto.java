package app.together.common.ai.api;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/** Personality, vector/document tokens, calendar, user behavior, chat history (workflow FE inputs). */
public record AiContextDto(
        String personality,
        List<String> documentTokens,
        JsonNode calendar,
        JsonNode userBehavior,
        List<AiChatTurnDto> chatHistory) {
}
