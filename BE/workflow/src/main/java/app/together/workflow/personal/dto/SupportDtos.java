package app.together.workflow.personal.dto;

import java.time.Instant;

public final class SupportDtos {

    private SupportDtos() {
    }

    public record SupportMessageResponse(
            Long messageId,
            String userSso,
            String sender,
            String message,
            Instant createdAt) {
    }

    public record SupportConversationResponse(
            String userSso,
            String userName,
            String userPlan,
            String userStatus,
            String lastMessagePreview,
            Instant lastMessageAt) {
    }

    public record SendSupportMessageRequest(String message) {
    }
}
