package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import app.together.common.workflow.entity.CoinPackage.StringListConverter;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class SubscriptionPlan extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    @EqualsAndHashCode.Include
    Long planId;

    /** Matches {@link app.together.common.auth.enums.UserTier} names (PRO/PLUS/TEAM). */
    @Column(name = "tier_code", nullable = false, unique = true)
    String tierCode;

    @Column(name = "name", nullable = false)
    String name;

    @Column(columnDefinition = "TEXT")
    String description;

    /** Package price in VND (pay via PayOS). */
    @Column(name = "price_vnd", nullable = false)
    Long priceVnd;

    /**
     * @deprecated Replaced by {@link #priceVnd}. Kept nullable for legacy rows during migration.
     */
    @Deprecated
    @Column(name = "price_per_day_coins")
    Integer pricePerDayCoins;

    /** Package length in days after successful payment. */
    @Column(name = "duration_days")
    Integer durationDays;

    @Column(name = "is_active")
    Boolean isActive;

    @Column(name = "is_popular")
    Boolean isPopular;

    @Column(name = "display_order")
    Integer displayOrder;

    @Column(name = "features", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    List<String> features;
}
