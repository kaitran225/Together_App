package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

/**
 * Theo dõi lần gần nhất user (gói FREE) bị trừ Coin để dùng một tính năng theo khung giờ
 * (VD: AI chat được dùng thoải mái trong 1 tiếng sau khi trả phí lần đầu).
 */
@Entity
@Table(name = "user_feature_usage")
@IdClass(UserFeatureUsageId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class UserFeatureUsage extends BaseAuditEntity {

    @Id
    @Column(name = "user_sso", nullable = false)
    @EqualsAndHashCode.Include
    String userSso;

    @Id
    @Column(name = "feature_code", nullable = false)
    @EqualsAndHashCode.Include
    String featureCode;

    @Column(name = "last_charged_at", nullable = false)
    Instant lastChargedAt;
}
