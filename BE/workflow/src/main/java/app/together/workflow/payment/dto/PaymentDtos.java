package app.together.workflow.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentDtos {

    private PaymentDtos() {
    }

    public record CheckoutResponse(
            Long paymentId,
            String checkoutUrl,
            BigDecimal amount,
            Integer coinsAmount
    ) {
    }

    public record PayOsWebhookPayload(
            String code,
            String checkoutUrl,
            PayOsWebhookData data,
            String signature
    ) {
    }

    public record PayOsWebhookData(
            Long orderCode,
            Integer amount,
            String description,
            String reference,
            String paymentLinkId,
            String status
    ) {
    }

    public record TransactionResponse(
            Long transactionId,
            Integer amount,
            String type,
            String category,
            String description,
            Instant createdAt
    ) {
    }
}
