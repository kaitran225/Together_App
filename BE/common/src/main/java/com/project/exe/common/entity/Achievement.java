package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Achievement extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "achievement_id")
    @EqualsAndHashCode.Include
    Long achievementId;

    @Column(nullable = false, unique = true)
    String name;

    @Column(name = "display_name", nullable = false)
    String displayName;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "icon_url", columnDefinition = "TEXT")
    String iconUrl;

    @Column(name = "exp_reward")
    Integer expReward;

    @Column(name = "coin_reward")
    Integer coinReward;

    @Column(name = "requirement_type")
    String requirementType;

    @Column(name = "requirement_value")
    Integer requirementValue;

    @Column(name = "is_active")
    Boolean isActive = true;
}
