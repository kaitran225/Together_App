package com.project.exe.common.entity;

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

    @Column(name = "attachments", columnDefinition = "jsonb")
    String attachments;

    @Column(name = "is_pinned")
    Boolean isPinned = false;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
