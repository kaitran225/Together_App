package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "app_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class AppConfig extends BaseAuditEntity {

    @Id
    @Column(name = "config_key")
    @EqualsAndHashCode.Include
    String configKey;

    @Column(name = "config_type", nullable = false)
    String configType;

    @Column(name = "value", columnDefinition = "TEXT")
    String value;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "display_name")
    String displayName;

    @Column(name = "is_public")
    Boolean isPublic = false;

    @Column(name = "is_enabled")
    Boolean isEnabled = false;

    @Column(name = "rollout_percentage")
    Integer rolloutPercentage;

    @Column(name = "target_users", columnDefinition = "bigint[]")
    String targetUsers;

    @Column(name = "feature_type")
    String featureType;

    @Column(name = "unlock_level")
    Integer unlockLevel;

    @Column(name = "icon_url", columnDefinition = "TEXT")
    String iconUrl;
}
