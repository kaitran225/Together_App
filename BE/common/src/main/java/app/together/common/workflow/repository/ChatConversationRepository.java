package app.together.common.workflow.repository;

import app.together.common.workflow.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    List<ChatConversation> findByUserSso(String userSso);

    List<ChatConversation> findByUserSsoOrderByLastMessageAtDesc(String userSso);
}
