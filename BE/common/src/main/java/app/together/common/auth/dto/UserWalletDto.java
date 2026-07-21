package app.together.common.auth.dto;

import app.together.common.auth.enums.WalletStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserWalletDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long walletId,
        Long userId,
        Integer balance,
        Integer bonusBalance,
        Integer pendingBalance,
        Integer lifetimeEarned,
        Integer lifetimeSpent,
        Instant lastTransactionAt,
        WalletStatus status,
        Long version,
        String metadata
) {
}
