package app.together.cronjob.scheduler;

import app.together.common.workflow.entity.PaymentTransaction;
import app.together.common.workflow.enums.PaymentStatus;
import app.together.common.workflow.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PendingPaymentExpiryScheduler {

    private static final int PENDING_TTL_MINUTES = 15;

    private final PaymentTransactionRepository paymentTransactionRepository;

    /**
     * Mỗi phút: PENDING quá 15 phút → FAILED (PayOS link / user hủy không cập nhật DB).
     */
    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void expireStalePendingPayments() {
        Instant cutoff = Instant.now().minus(PENDING_TTL_MINUTES, ChronoUnit.MINUTES);
        List<PaymentTransaction> stale = paymentTransactionRepository
                .findByStatusAndCreatedAtBefore(PaymentStatus.PENDING.name(), cutoff);

        if (stale.isEmpty()) {
            return;
        }

        for (PaymentTransaction tx : stale) {
            tx.setStatus(PaymentStatus.FAILED.name());
        }
        paymentTransactionRepository.saveAll(stale);
        log.info("PendingPaymentExpiryScheduler: marked {} PENDING payment(s) as FAILED (older than {}m)",
                stale.size(), PENDING_TTL_MINUTES);
    }
}
