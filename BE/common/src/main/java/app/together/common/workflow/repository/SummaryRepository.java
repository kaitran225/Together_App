package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SummaryRepository extends JpaRepository<Summary, Long> {

    List<Summary> findByDocumentId(Long documentId);

    List<Summary> findByDocumentIdOrderByGeneratedAtDesc(Long documentId);

    @Query("""
            select s
            from Summary s
            join Document d on d.documentId = s.documentId
            where d.userSso = :userSso
              and d.deletedAt is null
            order by s.generatedAt desc, s.summaryId desc
            """)
    List<Summary> findHistoryByUserSso(@Param("userSso") String userSso);
}
