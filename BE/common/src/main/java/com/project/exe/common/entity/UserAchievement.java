package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "user_achievements")
@IdClass(UserAchievementId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class UserAchievement extends BaseAuditEntity {

    @Id
    @Column(name = "user_id", nullable = false)
    @EqualsAndHashCode.Include
    Long userId;

    @Id
    @Column(name = "achievement_id", nullable = false)
    @EqualsAndHashCode.Include
    Long achievementId;

    @Column(name = "progress")
    Integer progress;

    @Column(name = "unlocked_at")
    Instant unlockedAt;
}
