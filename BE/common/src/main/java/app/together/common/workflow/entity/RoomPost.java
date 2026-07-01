package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "room_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class RoomPost extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_id")
    @EqualsAndHashCode.Include
    Long postId;

    @Column(name = "room_id", nullable = false)
    @EqualsAndHashCode.Include
    Long roomId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(name = "parent_post_id")
    Long parentPostId;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "attachments", columnDefinition = "jsonb")
    String attachments;

    @Column(name = "is_pinned")
    Boolean isPinned;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
