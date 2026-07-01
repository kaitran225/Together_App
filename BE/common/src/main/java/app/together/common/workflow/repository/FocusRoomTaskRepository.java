package app.together.common.workflow.repository;

import app.together.common.workflow.entity.FocusRoomTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FocusRoomTaskRepository extends JpaRepository<FocusRoomTask, Long> {
    List<FocusRoomTask> findByUserSsoOrderByDueDateAsc(String userSso);
}
