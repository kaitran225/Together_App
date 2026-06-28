package app.together.workflow.payment.dto;

import java.time.Instant;

public final class SubscriptionDtos {

    private SubscriptionDtos(){}

    public record UpgradeTierRequest(
            String targetTier, // PRO, TEAMS, PLUS
            Integer durationDays
    ) {}

    public record SubscriptionResponse(
            String userSso,
            String planType,
            Instant planExpiresAt,
            Integer coinsDeducted,
            Integer walletBalanceAfter
    ) {}
}
