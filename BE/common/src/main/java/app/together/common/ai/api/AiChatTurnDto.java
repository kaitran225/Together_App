package app.together.common.ai.api;

/** One turn in a chat conversation sent to the AI gateway. */
public record AiChatTurnDto(String role, String content) {
}
