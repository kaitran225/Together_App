package app.together.workflow.personal.dto;

import java.time.Instant;

public record UserAchievementDetailResponse(
    Long achievementId,
    String name,
    String displayName,
    String description,
    String iconUrl,
    Integer expReward,
    Integer coinReward,
    String requirementType,
    Integer requirementValue,
    Integer progress,
    Instant unlockedAt,
    Boolean isUnlocked
) {}
