package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserSsoOrderByCreatedAtDesc(String userSso);

    List<Notification> findByUserSso(String userSso);

    boolean existsByUserSsoAndTypeAndLinkId(String userSso, String type, Long linkId);
}
