package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuizAttempt extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id")
    @EqualsAndHashCode.Include
    Long attemptId;

    @Column(name = "quiz_id", nullable = false)
    @EqualsAndHashCode.Include
    Long quizId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(name = "score", precision = 5, scale = 2)
    BigDecimal score;

    @Column(name = "user_answer", columnDefinition = "jsonb")
    String userAnswer;

    @Column(name = "is_correct")
    Boolean isCorrect;

    @Column(name = "points_earned")
    Integer pointsEarned;

    @Column(name = "points_possible")
    Integer pointsPossible;

    @Column(name = "time_spent_seconds")
    Integer timeSpentSeconds;

    @Column(name = "status")
    String status;

    @Column(name = "started_at")
    Instant startedAt;

    @Column(name = "completed_at")
    Instant completedAt;
}
