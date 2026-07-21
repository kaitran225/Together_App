package app.together.common.workflow.repository;

import app.together.common.workflow.entity.UserFeatureUsage;
import app.together.common.workflow.entity.UserFeatureUsageId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserFeatureUsageRepository extends JpaRepository<UserFeatureUsage, UserFeatureUsageId> {
}
