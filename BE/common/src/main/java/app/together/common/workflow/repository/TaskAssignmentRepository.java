package app.together.common.workflow.repository;

import app.together.common.workflow.entity.TaskAssignment;
import app.together.common.workflow.entity.TaskAssignmentId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, TaskAssignmentId> {

    List<TaskAssignment> findByTaskId(Long taskId);

    List<TaskAssignment> findByUserSso(String userSso);

    List<TaskAssignment> findByTaskIdIn(List<Long> taskIds);
}
