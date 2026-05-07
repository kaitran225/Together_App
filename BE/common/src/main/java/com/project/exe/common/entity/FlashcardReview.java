package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "flashcard_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class FlashcardReview extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    @EqualsAndHashCode.Include
    Long reviewId;

    @Column(name = "flashcard_id", nullable = false)
    @EqualsAndHashCode.Include
    Long flashcardId;

    @Column(name = "user_master_data_id", nullable = false)
    @EqualsAndHashCode.Include
    Long userMasterDataId;

    @Column(name = "quality")
    Integer quality;

    @Column(name = "time_spent_seconds")
    Integer timeSpentSeconds;

    @Column(name = "reviewed_at")
    Instant reviewedAt;
}
