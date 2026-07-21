package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Mindmap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MindmapRepository extends JpaRepository<Mindmap, Long> {

    List<Mindmap> findByDocumentId(Long documentId);
    List<Mindmap> findByUserSso(String userSso);
}
