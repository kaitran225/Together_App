package app.together.cronjob.scheduler;

import app.together.common.auth.entity.User;
import app.together.common.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Scheduled task chạy hàng ngày lúc 00:05 (GMT+7) để kiểm tra và reset streak
 * của những người dùng không hoạt động ngày hôm qua.
 *
 * Logic:
 * - Nếu lastActiveDate = ngày hôm qua → streak vẫn giữ nguyên (đang duy trì)
 * - Nếu lastActiveDate < ngày hôm qua → streak bị reset về 0
 * - Nếu lastActiveDate = hôm nay → streak vẫn giữ (đang hoạt động)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StreakResetScheduler {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;

    /**
     * Chạy mỗi ngày lúc 00:05 (giờ Asia/Ho_Chi_Minh).
     * Quét tất cả người dùng có streak > 0 và kiểm tra xem họ có hoạt động
     * trong ngày hôm qua hay không.
     */
    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void resetInactiveStreaks() {
        log.info("StreakResetScheduler: Bắt đầu quét reset streak...");

        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        LocalDate yesterday = today.minusDays(1);

        List<User> allUsers = userRepository.findAll();
        int resetCount = 0;

        for (User user : allUsers) {
            if (user.getStreak() == null || user.getStreak() <= 0) {
                continue;
            }

            LocalDate lastActive = user.getLastActiveDate();
            if (lastActive == null) {
                // Không có lastActiveDate nhưng có streak → reset
                user.setStreak(0);
                userRepository.save(user);
                resetCount++;
                continue;
            }

            // Nếu ngày hoạt động cuối cùng < ngày hôm qua → đã bỏ lỡ ≥ 1 ngày → reset
            if (lastActive.isBefore(yesterday)) {
                log.debug("Resetting streak for user {} (lastActive={}, yesterday={})",
                        user.getUserSso(), lastActive, yesterday);
                user.setStreak(0);
                userRepository.save(user);
                resetCount++;
            }
            // Nếu lastActive = yesterday hoặc today → streak vẫn giữ nguyên
        }

        log.info("StreakResetScheduler: Hoàn tất. Đã reset streak cho {} người dùng.", resetCount);
    }
}
