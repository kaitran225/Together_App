package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "quiz_analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuizAnalytics extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "analytics_id")
    @EqualsAndHashCode.Include
    Long analyticsId;

    @Column(name = "user_master_data_id", nullable = false)
    @EqualsAndHashCode.Include
    Long userMasterDataId;

    @Column(name = "weak_topics", columnDefinition = "jsonb")
    String weakTopics;

    @Column(name = "strong_topics", columnDefinition = "jsonb")
    String strongTopics;

    @Column(name = "mistake_patterns", columnDefinition = "jsonb")
    String mistakePatterns;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    String recommendations;

    @Column(name = "improvement_areas", columnDefinition = "text[]")
    String improvementAreas;

    @Column(name = "generated_at")
    Instant generatedAt;
}
