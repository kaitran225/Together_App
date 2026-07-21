package app.together.common.auth.dto;

import app.together.common.shared.enums.TransactionType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserTransactionDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long userTransactionId,
        Long userId,
        Long walletId,
        Integer amount,
        Integer balanceAfter,
        TransactionType type,
        String referenceType,
        String referenceId,
        String description,
        String metadata
) {
}
