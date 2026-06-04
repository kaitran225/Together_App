package app.together.common.workflow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import app.together.common.workflow.entity.Sprint;

public interface SprintRepository extends JpaRepository<Sprint, Long>{
    List<Sprint> findByProjectId(Long projectId);

}
