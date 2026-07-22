package app.together.common.workflow.repository;

import app.together.common.workflow.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    List<PaymentTransaction> findByUserSso(String userSso);

    List<PaymentTransaction> findByStatusAndCreatedAtBefore(String status, Instant createdAtBefore);

    @Query(value = """
            SELECT * FROM payment_transactions
            WHERE (metadata->>'payosOrderCode')::bigint = :orderCode
            LIMIT 1
            """, nativeQuery = true)
    Optional<PaymentTransaction> findByPayOsOrderCode(@Param("orderCode") Long orderCode);
}
