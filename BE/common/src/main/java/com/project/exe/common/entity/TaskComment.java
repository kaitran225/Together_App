package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "task_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class TaskComment extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "comment_id")
    @EqualsAndHashCode.Include
    Long commentId;

    @Column(name = "task_id", nullable = false)
    @EqualsAndHashCode.Include
    Long taskId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @Column(name = "attachments", columnDefinition = "jsonb")
    String attachments;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
