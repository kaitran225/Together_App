package app.together.cronjob.scheduler;

import app.together.common.workflow.entity.Notification;
import app.together.common.workflow.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Scheduled task chạy mỗi ngày lúc 03:00 (GMT+7) để dọn dẹp
 * các notification đã hết hạn (expires_at < now).
 * Xóa mềm hoặc xóa cứng tùy chiến lược.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationCleanupScheduler {

    private final NotificationRepository notificationRepository;

    /**
     * Chạy hàng ngày lúc 03:00 (GMT+7).
     * Xóa tất cả notification đã hết hạn.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void cleanupExpiredNotifications() {
        log.info("NotificationCleanupScheduler: Bắt đầu dọn dẹp thông báo hết hạn...");

        Instant now = Instant.now();
        List<Notification> allNotifications = notificationRepository.findAll();

        int deletedCount = 0;
        for (Notification notification : allNotifications) {
            if (notification.getExpiresAt() != null && notification.getExpiresAt().isBefore(now)) {
                notificationRepository.delete(notification);
                deletedCount++;
            }
        }

        log.info("NotificationCleanupScheduler: Hoàn tất. Đã xóa {} thông báo hết hạn.", deletedCount);
    }
}
