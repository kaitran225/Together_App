package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUserSso(String userSso);
    List<Document> findByUserSsoAndDeletedAtIsNull(String userSso);
}
