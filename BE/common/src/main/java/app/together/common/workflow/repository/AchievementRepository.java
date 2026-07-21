package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    Optional<Achievement> findByName(String name);
}
