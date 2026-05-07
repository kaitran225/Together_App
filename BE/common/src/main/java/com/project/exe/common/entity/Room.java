package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Room extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    @EqualsAndHashCode.Include
    Long roomId;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "goal_description", columnDefinition = "TEXT")
    String goalDescription;

    @Column(name = "goal_duration_days")
    Integer goalDurationDays;

    @Column(name = "max_members")
    Integer maxMembers;

    @Column(name = "is_premium")
    Boolean isPremium = false;

    @Column(name = "is_public")
    Boolean isPublic = true;

    @Column(name = "invite_code", unique = true)
    String inviteCode;

    @Column(name = "status")
    String status;

    @Column(name = "activated_at")
    Instant activatedAt;

    @Column(name = "expires_at")
    Instant expiresAt;

    @Column(name = "closed_at")
    Instant closedAt;

    @Column(name = "closed_by")
    String closedBy;

    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
