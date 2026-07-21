package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import app.together.common.workflow.enums.RoomType;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @Column(name = "is_premium")
    Boolean isPremium;

    @Column(name = "max_members")
    Integer maxMembers;

    @Column(name = "is_public")
    Boolean isPublic;

    @Column(name = "invite_code", unique = true)
    String inviteCode;

    @Column(name = "status")
    String status;

    @Column(name = "topic", length = 32)
    String topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 32)
    RoomType roomType;

    @Column(name = "activated_at")
    Instant activatedAt;

    @Column(name = "expires_at")
    Instant expiresAt;

    @Column(name = "closed_at")
    Instant closedAt;

    @Column(name = "closed_by")
    String closedBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Version
    @Column(name = "version")
    Long version;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
