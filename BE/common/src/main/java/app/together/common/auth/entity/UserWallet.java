package app.together.common.auth.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import app.together.common.auth.enums.WalletStatus;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "user_wallets", schema = "auth")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class UserWallet extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wallet_id")
    @EqualsAndHashCode.Include
    Long walletId;

    @Column(name = "user_id", nullable = false, unique = true)
    @EqualsAndHashCode.Include
    Long userId;

    /** Spendable coin balance (primary bucket). */
    @Column(name = "balance")
    Integer balance;

    @Column(name = "bonus_balance")
    Integer bonusBalance;

    /** Coins held in pending / escrow states. */
    @Column(name = "pending_balance")
    Integer pendingBalance;

    @Column(name = "lifetime_earned")
    Integer lifetimeEarned;

    @Column(name = "lifetime_spent")
    Integer lifetimeSpent;

    @Column(name = "last_transaction_at")
    Instant lastTransactionAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32)
    WalletStatus status;

    @Version
    @Column(name = "version")
    long version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;
}
