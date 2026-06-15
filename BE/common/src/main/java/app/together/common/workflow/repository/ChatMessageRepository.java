package app.together.common.workflow.repository;

import app.together.common.workflow.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationId(Long conversationId);

    List<ChatMessage> findByConversationIdOrderBySentAtAsc(Long conversationId);
}
