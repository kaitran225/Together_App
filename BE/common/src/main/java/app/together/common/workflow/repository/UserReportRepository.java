package app.together.common.workflow.repository;

import app.together.common.workflow.entity.UserReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserReportRepository extends JpaRepository<UserReport, Long> {
    List<UserReport> findByStatus(String status);
}
