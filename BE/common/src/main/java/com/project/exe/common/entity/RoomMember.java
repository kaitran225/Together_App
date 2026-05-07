package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "room_members")
@IdClass(RoomMemberId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class RoomMember extends BaseAuditEntity {

    @Id
    @Column(name = "room_id", nullable = false)
    @EqualsAndHashCode.Include
    Long roomId;

    @Id
    @Column(name = "user_sso", nullable = false)
    @EqualsAndHashCode.Include
    String userSso;

    @Column(name = "role")
    String role;

    @Column(name = "last_active_at")
    Instant lastActiveAt;

    @Column(name = "is_active")
    Boolean isActive = true;

    @Column(name = "joined_at")
    Instant joinedAt;

    @Column(name = "left_at")
    Instant leftAt;
}
