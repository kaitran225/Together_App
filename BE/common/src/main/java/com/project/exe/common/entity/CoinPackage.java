package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Entity
@Table(name = "coin_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class CoinPackage extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    @EqualsAndHashCode.Include
    Long packageId;

    @Column(name = "package_name", nullable = false)
    String packageName;

    @Column(name = "coins_amount", nullable = false)
    Integer coinsAmount;

    @Column(name = "bonus_coins")
    Integer bonusCoins;

    @Column(name = "price_vnd", nullable = false, precision = 10, scale = 2)
    BigDecimal priceVnd;

    @Column(name = "is_popular")
    Boolean isPopular = false;

    @Column(name = "is_active")
    Boolean isActive = true;

    @Column(name = "display_order")
    Integer displayOrder;

    @Column(columnDefinition = "TEXT")
    String description;
}
