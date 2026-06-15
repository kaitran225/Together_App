package app.together.workflow.personal.dto;

import java.time.Instant;
import java.util.List;

public final class ChatDtos {

    private ChatDtos() {
    }

    public record CreateConversationRequest(
            String title,
            String contextType
    ) {
    }

    public record ChatConversationResponse(
            Long conversationId,
            String userSso,
            String title,
            String contextType,
            Instant startAt,
            Instant lastMessageAt
    ) {
    }

    public record SendMessageRequest(
            String messageText
    ) {
    }

    public record ChatMessageResponse(
            Long messageId,
            Long conversationId,
            String sender, // user hoặc assistant
            String messageText,
            String actionTaken, // CREATION, SUMMARIZE, CHAT, SEARCH
            String actionMetadata, // JSONB kết quả của tool
            Instant sentAt) {
    }

    public record AiServiceResponse(
            String replyText, // nội dung chatbot trả lời bằng chữ
            String actionTaken, // hành động tool agent nhận diện
            String actionMetadata // nội dung json cấu trúc của tool ( JSON của flascard,... )
    ) {
    }

    public record AiQuizPayload(
            String title,
            String description,
            String difficulty,
            Integer timeLimitMinutes,
            List<AiQuizQuestions> questions
    ) {
    }

    public record AiQuizQuestions(
            String questionText,
            String questionType, // SINGLE, MULTIPLE, TF
            List<String> options,
            String correctAnswer,
            String explanation,
            Integer points
    ) {
    }

    public record GenerateQuizRequest(
            Long documentId,
            String prompt
    ) {
    }

}
