package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByUserSso(String userSso);
    List<Schedule> findByUserSsoAndDeletedAtIsNull(String userSso);
}
