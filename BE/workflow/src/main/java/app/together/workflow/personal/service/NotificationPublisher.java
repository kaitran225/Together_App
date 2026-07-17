package app.together.workflow.personal.service;

import app.together.common.workflow.entity.Notification;
import app.together.common.workflow.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;

/**
 * Creates in-app notifications for team / meeting events.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    public static final String TYPE_TEAM_INVITE = "TEAM_INVITE";
    public static final String TYPE_TEAM_JOIN = "TEAM_JOIN";
    public static final String TYPE_MEETING = "MEETING";

    public static final String LINK_TEAM = "TEAM";
    public static final String LINK_MEETING = "MEETING";

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyUser(String userSso, String type, String title, String message,
                           String linkType, Long linkId, Instant expiresAt) {
        if (userSso == null || userSso.isBlank()) {
            return;
        }
        Notification notification = Notification.builder()
                .userSso(userSso.trim())
                .type(type)
                .title(title)
                .message(message)
                .linkType(linkType)
                .linkId(linkId)
                .isRead(false)
                .expiresAt(expiresAt != null ? expiresAt : Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        notificationRepository.save(notification);
        log.debug("Notification {} created for {}", type, userSso);
    }

    @Transactional
    public void notifyUsers(Collection<String> userSsos, String type, String title, String message,
                            String linkType, Long linkId, Instant expiresAt) {
        if (userSsos == null || userSsos.isEmpty()) {
            return;
        }
        for (String sso : userSsos) {
            notifyUser(sso, type, title, message, linkType, linkId, expiresAt);
        }
    }
}
