package app.together.common.workflow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import app.together.common.workflow.entity.TaskSubmission;

public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, Long> {

    List<TaskSubmission> findByTaskId(Long taskId);

}
