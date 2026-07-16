package app.together.common.workflow.repository;

import app.together.common.workflow.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    List<SupportMessage> findByUserSsoOrderByCreatedAtAsc(String userSso);
}
