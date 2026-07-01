package app.together.common.auth.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import app.together.common.shared.enums.TransactionType;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_transactions", schema = "auth")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class UserTransaction extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_transaction_id")
    @EqualsAndHashCode.Include
    Long userTransactionId;

    @Column(name = "user_id", nullable = false)
    Long userId;

    @Column(name = "wallet_id", nullable = false)
    Long walletId;

    @Column(name = "amount", nullable = false)
    Integer amount;

    /** Main wallet {@code balance} immediately after this entry is applied. */
    @Column(name = "balance_after", nullable = false)
    Integer balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 32)
    TransactionType type;

    @Column(name = "reference_type", length = 64)
    String referenceType;

    @Column(name = "reference_id", length = 128)
    String referenceId;

    @Column(columnDefinition = "TEXT")
    String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;
}
