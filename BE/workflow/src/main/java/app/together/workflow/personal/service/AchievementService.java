package app.together.workflow.personal.service;

import app.together.common.workflow.entity.Achievement;
import app.together.common.workflow.entity.UserAchievement;
import app.together.common.workflow.repository.AchievementRepository;
import app.together.common.workflow.repository.UserAchievementRepository;
import app.together.workflow.personal.dto.UserAchievementDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;

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
}
