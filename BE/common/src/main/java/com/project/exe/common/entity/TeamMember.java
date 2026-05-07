package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "team_members")
@IdClass(TeamMemberId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class TeamMember extends BaseAuditEntity {

    @Id
    @Column(name = "team_id", nullable = false)
    @EqualsAndHashCode.Include
    Long teamId;

    @Id
    @Column(name = "user_sso", nullable = false)
    @EqualsAndHashCode.Include
    String userSso;

    @Column(name = "role")
    String role;

    @Column(name = "nickname")
    String nickname;

    @Column(name = "joined_at")
    Instant joinedAt;

    @Column(name = "left_at")
    Instant leftAt;
}
