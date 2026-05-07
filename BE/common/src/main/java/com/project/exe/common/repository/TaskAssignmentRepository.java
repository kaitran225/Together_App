package com.project.exe.common.repository;

import com.project.exe.common.entity.TaskAssignment;
import com.project.exe.common.entity.TaskAssignmentId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, TaskAssignmentId> {

    List<TaskAssignment> findByTaskId(Long taskId);

    List<TaskAssignment> findByUserSso(String userSso);
}
