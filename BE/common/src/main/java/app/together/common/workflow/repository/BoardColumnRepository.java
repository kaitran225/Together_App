package app.together.common.workflow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import app.together.common.workflow.entity.BoardColumn;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {

    List<BoardColumn> findByProjectId(Long projectId);

}
