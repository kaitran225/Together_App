package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import app.together.common.workflow.enums.RoomType;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "room_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class RoomRequest extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    @EqualsAndHashCode.Include
    Long requestId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", length = 32)
    RoomType roomType;

    @Column(name = "goal_description", nullable = false, columnDefinition = "TEXT")
    String goalDescription;

    @Column(name = "goal_duration_days")
    Integer goalDurationDays;

    @Column(name = "preferred_size")
    Integer preferredSize;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    String tags;

    @Column(name = "status")
    String status;

    @Column(name = "matched_room_id")
    Long matchedRoomId;

    @Column(name = "priority_score")
    Integer priorityScore;

    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;

    @Column(name = "matched_at")
    Instant matchedAt;

    @Column(name = "cancelled_at")
    Instant cancelledAt;
}
