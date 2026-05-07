package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "task_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class TaskAttachment extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attachment_id")
    @EqualsAndHashCode.Include
    Long attachmentId;

    @Column(name = "task_id", nullable = false)
    @EqualsAndHashCode.Include
    Long taskId;

    @Column(name = "attachment_type", nullable = false)
    String attachmentType;

    @Column(nullable = false)
    String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    String url;

    @Column(name = "uploaded_by", nullable = false)
    String uploadedBy;

    @Column(name = "uploaded_at")
    Instant uploadedAt;
}
