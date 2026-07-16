package app.together.workflow.payment.dto;

import java.time.Instant;

public final class SubscriptionDtos {

    private SubscriptionDtos(){}

    public record CheckoutSubscriptionRequest(
            Long planId
    ) {}

    /** Kept for admin/manual apply; not used for user coin payment anymore. */
    public record UpgradeTierRequest(
            String targetTier,
            Integer durationDays
    ) {}

    public record SubscriptionResponse(
            String userSso,
            String planType,
            Instant planExpiresAt,
            Long amountVnd,
            String status
    ) {}
}
