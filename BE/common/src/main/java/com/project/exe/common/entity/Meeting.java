package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "meetings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Meeting extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meeting_id")
    @EqualsAndHashCode.Include
    Long meetingId;

    @Column(name = "team_id")
    Long teamId;

    @Column(name = "room_id")
    Long roomId;

    @Column(name = "project_id")
    Long projectId;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "agenda", columnDefinition = "TEXT")
    String agenda;

    @Column(name = "meeting_url", columnDefinition = "TEXT")
    String meetingUrl;

    @Column(name = "meeting_platform")
    String meetingPlatform;

    @Column(name = "scheduled_start", nullable = false)
    Instant scheduledStart;

    @Column(name = "scheduled_end", nullable = false)
    Instant scheduledEnd;

    @Column(name = "actual_start")
    Instant actualStart;

    @Column(name = "actual_end")
    Instant actualEnd;

    @Column(name = "max_duration")
    Integer maxDuration;

    @Column(name = "status")
    String status;

    @Column(name = "recording_url", columnDefinition = "TEXT")
    String recordingUrl;

    @Column(name = "transcript_url", columnDefinition = "TEXT")
    String transcriptUrl;

    @Column(name = "cancelled_at")
    Instant cancelledAt;
}
