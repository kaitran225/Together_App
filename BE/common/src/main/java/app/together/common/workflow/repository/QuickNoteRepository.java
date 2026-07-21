package app.together.common.workflow.repository;

import app.together.common.workflow.entity.QuickNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuickNoteRepository extends JpaRepository<QuickNote, Long> {

    List<QuickNote> findByUserSso(String userSso);
    List<QuickNote> findByUserSsoAndDeletedAtIsNullOrderByIsPinnedDescCreatedAtDesc(String userSso);
}
