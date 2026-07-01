package app.together.workflow.room.listener;

import app.together.common.auth.repository.UserRepository;
import app.together.common.auth.entity.User;
import app.together.common.workflow.entity.Achievement;
import app.together.common.workflow.entity.UserAchievement;
import app.together.common.workflow.entity.UserAchievementId;
import app.together.common.workflow.repository.AchievementRepository;
import app.together.common.workflow.repository.UserAchievementRepository;
import app.together.workflow.room.event.StudySessionCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Lắng nghe các sự kiện học tập (Social Room, Personal Quiz, Team Meeting)
 * để cập nhật: EXP, Streak, và trao tặng Achievements.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GamificationListener {

    private static final int EXP_PER_MINUTE = 20;
    private static final int COMPLETION_BONUS_EXP = 50;
    private static final int STREAK_BONUS_EXP = 10;
    private static final int MIN_EXP = 0;
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserRepository userRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;

    @EventListener
    @Transactional
    public void onStudySessionCompleted(StudySessionCompletedEvent event) {
        if (event == null || event.userSso() == null || event.userSso().isBlank()) {
            return;
        }

        var userOpt = userRepository.findByUserSso(event.userSso());
        if (userOpt == null || userOpt.isEmpty()) {
            return;
        }

        User user = userOpt.get();

        // ── 1. Cộng EXP ──
        int durationMinutes = Math.max(0, event.durationMinutes());
        int expEarned = durationMinutes > 0 ? durationMinutes : 1;

        int currentExp = Math.max(MIN_EXP, user.getExp() == null ? 0 : user.getExp());

        // ── 2. Cập nhật Streak ──
        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        LocalDate lastActiveDate = user.getLastActiveDate();
        int currentStreak = user.getStreak() != null ? user.getStreak() : 0;
        int longestStreak = user.getLongestStreak() != null ? user.getLongestStreak() : 0;

        if (lastActiveDate == null) {
            // Lần đầu tiên hoạt động
            currentStreak = 1;
        } else if (lastActiveDate.equals(today)) {
            // Đã hoạt động hôm nay rồi → không tăng streak, nhưng vẫn cộng EXP
            // (streak giữ nguyên)
        } else if (lastActiveDate.equals(today.minusDays(1))) {
            // Hoạt động ngày hôm qua → chuỗi liên tiếp!
            currentStreak++;
            expEarned += STREAK_BONUS_EXP * currentStreak; // Bonus EXP cho mỗi ngày streak
        } else {
            // Đã bỏ lỡ 1+ ngày → reset streak
            currentStreak = 1;
        }

        // Cập nhật longest streak nếu cần
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        user.setExp(currentExp + expEarned);
        user.setStreak(currentStreak);
        user.setLongestStreak(longestStreak);
        user.setLastActiveDate(today);

        // ── 3. Tính Level dựa trên tổng EXP ──
        // Công thức: Level = 1 + (totalExp / 100)
        int totalExp = user.getExp();
        int newLevel = (totalExp / 100) + 1;
        user.setLevel(Math.max(1, newLevel));

        userRepository.save(user);

        log.info("Gamification: user={} exp+={} streak={} longest={} level={}",
                event.userSso(), expEarned, currentStreak, longestStreak, user.getLevel());

        // ── 4. Kiểm tra & trao tặng Achievements ──
        checkAndGrantAchievements(user);
    }

    /**
     * Kiểm tra các thành tựu theo điều kiện và trao tặng cho người dùng.
     * Hỗ trợ các requirementType:
     * - STREAK: streak hiện tại >= requirementValue
     * - EXP: tổng EXP >= requirementValue
     * - LEVEL: level >= requirementValue
     * - LONGEST_STREAK: longest streak >= requirementValue
     */
    private void checkAndGrantAchievements(User user) {
        List<Achievement> allAchievements = achievementRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .toList();

        for (Achievement achievement : allAchievements) {
            // Kiểm tra xem user đã mở khóa chưa
            UserAchievementId id = new UserAchievementId(user.getUserSso(), achievement.getAchievementId());
            var existingOpt = userAchievementRepository.findById(id);

            if (existingOpt.isPresent() && existingOpt.get().getUnlockedAt() != null) {
                continue; // Đã mở khóa rồi → bỏ qua
            }

            boolean qualified = isQualified(user, achievement);
            int progress = calculateProgress(user, achievement);

            if (qualified) {
                // Mở khóa thành tựu!
                UserAchievement ua = existingOpt.orElse(UserAchievement.builder()
                        .userSso(user.getUserSso())
                        .achievementId(achievement.getAchievementId())
                        .build());
                ua.setProgress(achievement.getRequirementValue());
                ua.setUnlockedAt(Instant.now());
                userAchievementRepository.save(ua);

                // Cộng phần thưởng EXP và Coin nếu có
                if (achievement.getExpReward() != null && achievement.getExpReward() > 0) {
                    user.setExp(user.getExp() + achievement.getExpReward());
                }

                log.info("Achievement UNLOCKED: user={} achievement={}",
                        user.getUserSso(), achievement.getName());
            } else {
                // Cập nhật tiến trình
                UserAchievement ua = existingOpt.orElse(UserAchievement.builder()
                        .userSso(user.getUserSso())
                        .achievementId(achievement.getAchievementId())
                        .build());
                ua.setProgress(progress);
                userAchievementRepository.save(ua);
            }
        }
    }

    private boolean isQualified(User user, Achievement achievement) {
        if (achievement.getRequirementType() == null || achievement.getRequirementValue() == null) {
            return false;
        }

        return switch (achievement.getRequirementType().toUpperCase()) {
            case "STREAK" -> user.getStreak() != null && user.getStreak() >= achievement.getRequirementValue();
            case "EXP" -> user.getExp() != null && user.getExp() >= achievement.getRequirementValue();
            case "LEVEL" -> user.getLevel() != null && user.getLevel() >= achievement.getRequirementValue();
            case "LONGEST_STREAK" ->
                user.getLongestStreak() != null && user.getLongestStreak() >= achievement.getRequirementValue();
            default -> false;
        };
    }

    private int calculateProgress(User user, Achievement achievement) {
        if (achievement.getRequirementType() == null) {
            return 0;
        }

        return switch (achievement.getRequirementType().toUpperCase()) {
            case "STREAK" -> user.getStreak() != null ? user.getStreak() : 0;
            case "EXP" -> user.getExp() != null ? user.getExp() : 0;
            case "LEVEL" -> user.getLevel() != null ? user.getLevel() : 0;
            case "LONGEST_STREAK" -> user.getLongestStreak() != null ? user.getLongestStreak() : 0;
            default -> 0;
        };
    }
}
