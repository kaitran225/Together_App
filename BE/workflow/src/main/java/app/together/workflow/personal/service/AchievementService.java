package app.together.workflow.personal.service;

import app.together.common.auth.repository.UserRepository;
import app.together.common.workflow.entity.Achievement;
import app.together.common.workflow.entity.UserAchievement;
import app.together.common.workflow.entity.UserAchievementId;
import app.together.common.workflow.repository.AchievementRepository;
import app.together.common.workflow.repository.UserAchievementRepository;
import app.together.workflow.payment.service.WalletService;
import app.together.workflow.personal.dto.UserAchievementDetailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;

    public List<UserAchievementDetailResponse> getUserAchievements(String userSso) {
        List<Achievement> activeAchievements = achievementRepository.findAll().stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .toList();

        List<UserAchievement> userAchievements = userAchievementRepository.findByUserSso(userSso);
        Map<Long, UserAchievement> userMap = userAchievements.stream()
                .collect(Collectors.toMap(UserAchievement::getAchievementId, ua -> ua, (existing, replacement) -> existing));

        return activeAchievements.stream()
                .map(a -> {
                    UserAchievement ua = userMap.get(a.getAchievementId());
                    Integer progress = (ua != null && ua.getProgress() != null) ? ua.getProgress() : 0;
                    java.time.Instant unlockedAt = (ua != null) ? ua.getUnlockedAt() : null;
                    boolean isUnlocked = unlockedAt != null;

                    return new UserAchievementDetailResponse(
                            a.getAchievementId(),
                            a.getName(),
                            a.getDisplayName(),
                            a.getDescription(),
                            a.getIconUrl(),
                            a.getExpReward(),
                            a.getCoinReward(),
                            a.getRequirementType(),
                            a.getRequirementValue(),
                            progress,
                            unlockedAt,
                            isUnlocked
                    );
                })
                .toList();
    }

    /**
     * Trao một thành tựu cụ thể theo {@code name} (VD: "FIRST_SUBSCRIBER") ngay lập tức,
     * không qua vòng kiểm tra STREAK/EXP/LEVEL tự động — dùng cho các sự kiện một lần
     * như mua subscription. Bỏ qua an toàn nếu đã mở khóa trước đó.
     */
    @Transactional
    public void grantIfNotUnlocked(String userSso, String achievementName) {
        Achievement achievement = achievementRepository.findByName(achievementName).orElse(null);
        if (achievement == null || !Boolean.TRUE.equals(achievement.getIsActive())) {
            return;
        }

        UserAchievementId id = new UserAchievementId(userSso, achievement.getAchievementId());
        var existingOpt = userAchievementRepository.findById(id);
        if (existingOpt.isPresent() && existingOpt.get().getUnlockedAt() != null) {
            return; // Đã mở khóa rồi
        }

        UserAchievement ua = existingOpt.orElse(UserAchievement.builder()
                .userSso(userSso)
                .achievementId(achievement.getAchievementId())
                .build());
        ua.setProgress(achievement.getRequirementValue());
        ua.setUnlockedAt(Instant.now());
        userAchievementRepository.save(ua);

        if (achievement.getExpReward() != null && achievement.getExpReward() > 0) {
            userRepository.findByUserSso(userSso).ifPresent(user -> {
                user.setExp((user.getExp() == null ? 0 : user.getExp()) + achievement.getExpReward());
                userRepository.save(user);
            });
        }
        if (achievement.getCoinReward() != null && achievement.getCoinReward() > 0) {
            walletService.credit(userSso, achievement.getCoinReward(), "ACHIEVEMENT",
                    "Thưởng thành tựu: " + achievement.getDisplayName());
        }

        log.info("Achievement UNLOCKED (manual): user={} achievement={}", userSso, achievementName);
    }
}
