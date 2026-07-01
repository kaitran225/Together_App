package app.together.workflow.personal.service;

import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.dto.NotificationDto;
import app.together.common.workflow.mapper.NotificationMapper;
import app.together.common.workflow.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.together.common.workflow.entity.Notification;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;

    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications() {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return notificationRepository.findByUserSso(userSso).stream()
                .map(notificationMapper::toDto)
                .toList();
    }

    @Transactional
    public NotificationDto markAsRead(Long notificationId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUserSso().equals(userSso)) {
            throw new IllegalArgumentException("Forbidden");
        }
        notification.setIsRead(true);
        notification.setReadAt(java.time.Instant.now());
        return notificationMapper.toDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead() {
        String userSso = SecurityUtils.requireCurrentUserSso();
        List<Notification> notifications = notificationRepository.findByUserSso(userSso);
        notifications.forEach(n -> {
            if (!Boolean.TRUE.equals(n.getIsRead())) {
                n.setIsRead(true);
                n.setReadAt(java.time.Instant.now());
            }
        });
        notificationRepository.saveAll(notifications);
    }
}
