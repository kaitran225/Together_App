package app.together.common.workflow.repository;

import app.together.common.workflow.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByQuizId(Long quizId);

    long countByQuizId(Long quizId);
}
