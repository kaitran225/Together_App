package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "meeting_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class MeetingSummary extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "summary_id")
    @EqualsAndHashCode.Include
    Long summaryId;

    @Column(name = "meeting_id", nullable = false, unique = true)
    @EqualsAndHashCode.Include
    Long meetingId;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @Column(name = "key_points", columnDefinition = "text[]")
    String keyPoints;

    @Column(name = "action_items", columnDefinition = "jsonb")
    String actionItems;

    @Column(name = "decisions_made", columnDefinition = "text[]")
    String decisionsMade;

    @Column(name = "next_steps", columnDefinition = "text[]")
    String nextSteps;

    @Column(name = "model_used")
    String modelUsed;

    @Column(name = "generated_at")
    Instant generatedAt;
}
