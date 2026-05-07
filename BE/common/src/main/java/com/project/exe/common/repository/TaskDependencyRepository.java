package com.project.exe.common.repository;

import com.project.exe.common.entity.TaskDependency;
import com.project.exe.common.entity.TaskDependencyId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskDependencyRepository extends JpaRepository<TaskDependency, TaskDependencyId> {

    List<TaskDependency> findByTaskId(Long taskId);
}
