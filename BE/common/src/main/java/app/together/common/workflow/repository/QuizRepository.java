package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

  List<Quiz> findByUserSso(String userSso);

  @Query("""
      select q
      from Quiz q
      where q.deletedAt is null
        and (q.userSso = :userSso or upper(coalesce(q.visibility, 'PRIVATE')) = 'PUBLIC')
        and (cast(:keyword as string) is null
             or lower(q.title) like lower(concat('%', cast(:keyword as string), '%'))
             or lower(q.description) like lower(concat('%', cast(:keyword as string), '%')))
        and (cast(:difficulty as string) is null
             or upper(q.difficulty) = upper(cast(:difficulty as string)))
      order by
        case when q.sharedAt is null then q.createdAt else q.sharedAt end desc,
        q.quizId desc
      """)
  List<Quiz> findAvailableQuizSets(
      @Param("userSso") String userSso,
      @Param("keyword") String keyword,
      @Param("difficulty") String difficulty);
}
