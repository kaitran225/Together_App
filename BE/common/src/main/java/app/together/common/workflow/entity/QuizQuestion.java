package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuizQuestion extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    @EqualsAndHashCode.Include
    Long questionId;

    @Column(name = "quiz_id", nullable = false)
    @EqualsAndHashCode.Include
    Long quizId;

    @Column(name = "question_type")
    String questionType;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    String questionText;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "options", columnDefinition = "jsonb")
    String options;

    @Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
    String correctAnswer;

    @Column(columnDefinition = "TEXT")
    String explanation;

    @Column(name = "points")
    Integer points;

    @Column(name = "position")
    Integer position;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;
}
