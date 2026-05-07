package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Document extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    @EqualsAndHashCode.Include
    Long documentId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(name = "category_id")
    Long categoryId;

    @Column(nullable = false)
    String title;

    @Column(name = "file_path", nullable = false, columnDefinition = "TEXT")
    String filePath;

    @Column(name = "file_name", nullable = false)
    String fileName;

    @Column(name = "file_size")
    Long fileSize;

    @Column(name = "file_type")
    String fileType;

    @Column(name = "mime_type")
    String mimeType;

    @Column(name = "processing_status")
    String processingStatus;

    @Column(name = "error_message", columnDefinition = "TEXT")
    String errorMessage;

    @Column(name = "page_count")
    Integer pageCount;

    @Column(name = "word_count")
    Integer wordCount;

    @Column(name = "language")
    String language;

    @Column(name = "tags", columnDefinition = "text[]")
    String tags;

    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Column(name = "last_accessed_at")
    Instant lastAccessedAt;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
