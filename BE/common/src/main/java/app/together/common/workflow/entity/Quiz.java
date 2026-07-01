package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Quiz extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quiz_id")
    @EqualsAndHashCode.Include
    Long quizId;

    @Column(name = "document_id")
    Long documentId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "difficulty")
    String difficulty;

    @Column(name = "time_limit_minutes")
    Integer timeLimitMinutes;

    @Column(name = "passing_score")
    Integer passingScore;

    @Column(name = "is_randomized")
    Boolean isRandomized;

    @Column(name = "show_answers")
    Boolean showAnswers;

    @Column(name = "visibility")
    String visibility;

    @Column(name = "source")
    String source;

    @Column(name = "shared_at")
    Instant sharedAt;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
