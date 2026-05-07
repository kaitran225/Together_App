package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class PaymentTransaction extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    @EqualsAndHashCode.Include
    Long paymentId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(name = "transaction_type", nullable = false)
    String transactionType;

    @Column(nullable = false, precision = 10, scale = 2)
    BigDecimal amount;

    @Column(name = "coins_amount")
    Integer coinsAmount;

    @Column(name = "currency")
    String currency;

    @Column(name = "payment_method")
    String paymentMethod;

    @Column(name = "payment_gateway_id")
    @EqualsAndHashCode.Include
    String paymentGatewayId;

    @Column(name = "status")
    String status;

    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Column(name = "paid_at")
    Instant paidAt;
}
