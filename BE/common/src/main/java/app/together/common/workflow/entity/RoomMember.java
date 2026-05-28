package app.together.common.workflow.entity;

import app.together.common.auth.enums.RoomRole;
import app.together.common.shared.persistence.BaseAuditEntity;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    RoomRole role;

    @Column(name = "last_active_at")
    Instant lastActiveAt;

    @Column(name = "is_active")
    Boolean isActive;

    @Column(name = "joined_at")
    Instant joinedAt;

    @Version
    @Column(name = "version")
    Long version;

    @Column(name = "left_at")
    Instant leftAt;
}
