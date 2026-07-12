package app.together.workflow.personal.service;

import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.ChatConversation;
import app.together.common.workflow.entity.ChatMessage;
import app.together.common.workflow.repository.ChatConversationRepository;
import app.together.common.workflow.repository.ChatMessageRepository;
import app.together.common.workflow.repository.DocumentRepository;
import app.together.common.workflow.entity.Document;
import app.together.workflow.personal.service.ai.OllamaAiService;
import app.together.workflow.personal.dto.ChatDtos.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PersonalChatService {
    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DocumentRepository documentRepository;
    private final OllamaAiService ollamaAiService;

    /**
     * Tạo một luồng hội thoại chat mới với Chatbot AI.
     */
    public ChatConversationResponse createConversation(String userSso, CreateConversationRequest request) {
        ChatConversation conversation = ChatConversation.builder()
                .userSso(userSso)
                .title(request.title() != null ? request.title().trim() : "Trò chuyện mới")
                .contextType(request.contextType() != null ? request.contextType().trim() : "GENERAL")
                .startedAt(Instant.now())
                .lastMessageAt(Instant.now())
                .build();

        ChatConversation saved = chatConversationRepository.save(conversation);
        return toConversationResponse(saved);
    }

    /**
     * Gửi tin nhắn chat sang AI Service (qua Feign Client) và ghi nhận lịch sử kèm Metadata.
     */
    public ChatMessageResponse sendMessage(Long conversationId, String userSso, SendMessageRequest request) {
        ChatConversation conversation = chatConversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatConversation", conversationId));

        if (!conversation.getUserSso().equals(userSso)) {
            throw new BadRequestException("Bạn không có quyền gửi tin nhắn vào luồng hội thoại này.");
        }

        Instant now = Instant.now();

        // 1. Lưu tin nhắn của Người dùng (USER) vào database
        ChatMessage userMessage = ChatMessage.builder()
                .conversationId(conversationId)
                .sender("USER")
                .messageText(request.messageText() != null ? request.messageText().trim() : "")
                .sentAt(now)
                .build();
        chatMessageRepository.save(userMessage);

        // 2. Sử dụng Ollama (Qwen2.5:3b) để sinh câu trả lời
        AiServiceResponse aiResponse;
        try {
            if (request.documentId() != null) {
                Document document = documentRepository.findById(request.documentId()).orElse(null);
                if (document != null && document.getExtractedText() != null && !document.getExtractedText().isBlank()) {
                    String answer = ollamaAiService.answerQuestionFromDocument(document.getExtractedText(), request.messageText().trim());
                    aiResponse = new AiServiceResponse(answer, "CHAT", "{}");
                } else {
                    aiResponse = ollamaAiService.chat(request.messageText().trim());
                }
            } else {
                aiResponse = ollamaAiService.chat(request.messageText().trim());
            }
        } catch (Exception e) {
            log.error("Failed to call Ollama, returning offline fallback response", e);
            aiResponse = new AiServiceResponse(
                "Xin chào! Tôi là Together AI Chatbot (Qwen2.5). Hiện tại kết nối đến AI Service đang ngoại tuyến, tôi đang phản hồi ở chế độ offline. Tôi có thể giúp gì cho bạn?",
                "CHAT",
                "{}"
            );
        }

        // 3. Lưu tin nhắn phản hồi của AI Chatbot vào database
        ChatMessage aiMessage = ChatMessage.builder()
                .conversationId(conversationId)
                .sender("ASSISTANT")
                .messageText(aiResponse.replyText()) // Nội dung phản hồi bằng chữ
                .actionTaken(aiResponse.actionTaken()) // Hành động được thực thi (ví dụ: CREATION, SUMMARIZE)
                .actionMetadata(aiResponse.actionMetadata()) // Dữ liệu JSONB của Tool (ví dụ: Json của Flashcard/Quiz để Frontend render)
                .sentAt(Instant.now())
                .build();
        ChatMessage savedAiMessage = chatMessageRepository.save(aiMessage);

        // Cập nhật mốc thời gian tin nhắn cuối cho cuộc hội thoại
        conversation.setLastMessageAt(Instant.now());
        chatConversationRepository.save(conversation);

        return toMessageResponse(savedAiMessage);
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> getConversations(String userSso) {
        return chatConversationRepository.findByUserSsoOrderByLastMessageAtDesc(userSso).stream()
                .map(this::toConversationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long conversationId, String userSso) {
        ChatConversation conversation = chatConversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatConversation", conversationId));

        if (!conversation.getUserSso().equals(userSso)) {
            throw new BadRequestException("Bạn không có quyền xem lịch sử luồng hội thoại này.");
        }

        return chatMessageRepository.findByConversationIdOrderBySentAtAsc(conversationId).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    private ChatConversationResponse toConversationResponse(ChatConversation conv) {
        return new ChatConversationResponse(conv.getConversationId(), conv.getUserSso(), conv.getTitle(), conv.getContextType(), conv.getStartedAt(), conv.getLastMessageAt());
    }

    private ChatMessageResponse toMessageResponse(ChatMessage msg) {
        return new ChatMessageResponse(msg.getMessageId(), msg.getConversationId(), msg.getSender(), msg.getMessageText(), msg.getActionTaken(), msg.getActionMetadata(), msg.getSentAt());
    }
}
