package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "flashcards")
@IdClass(FlashcardId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Flashcard extends BaseAuditEntity {

    @Id
    @Column(name = "quiz_id", nullable = false)
    @EqualsAndHashCode.Include
    Long quizId;

    @Id
    @Column(name = "quiz_question_id", nullable = false)
    @EqualsAndHashCode.Include
    Long quizQuestionId;

    @Column(name = "ease_factor", precision = 3, scale = 2)
    BigDecimal easeFactor;

    @Column(name = "interval")
    Integer interval;

    @Column(name = "repetitions")
    Integer repetitions;

    @Column(name = "next_review_date")
    LocalDate nextReviewDate;
}
