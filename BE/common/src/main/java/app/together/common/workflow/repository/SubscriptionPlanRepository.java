package app.together.common.workflow.repository;

import app.together.common.workflow.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {

    Optional<SubscriptionPlan> findByTierCodeAndIsActiveTrue(String tierCode);

    List<SubscriptionPlan> findAllByOrderByDisplayOrderAsc();
}
