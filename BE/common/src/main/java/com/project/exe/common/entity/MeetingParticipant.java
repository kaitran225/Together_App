package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "meeting_participants")
@IdClass(MeetingParticipantId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class MeetingParticipant extends BaseAuditEntity {

    @Id
    @Column(name = "meeting_id", nullable = false)
    @EqualsAndHashCode.Include
    Long meetingId;

    @Id
    @Column(name = "user_sso", nullable = false)
    @EqualsAndHashCode.Include
    String userSso;

    @Column(name = "invitation_status")
    String invitationStatus;

    @Column(name = "attendance_status")
    String attendanceStatus;

    @Column(name = "joined_at")
    Instant joinedAt;

    @Column(name = "left_at")
    Instant leftAt;

    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Column(name = "invited_at")
    Instant invitedAt;
}
