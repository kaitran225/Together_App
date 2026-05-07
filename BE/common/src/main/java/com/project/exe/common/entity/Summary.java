package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Summary extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "summary_id")
    @EqualsAndHashCode.Include
    Long summaryId;

    @Column(name = "document_id", nullable = false)
    @EqualsAndHashCode.Include
    Long documentId;

    @Column(name = "summary_type")
    String summaryType;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @Column(name = "model_used")
    String modelUsed;

    @Column(name = "generated_at")
    Instant generatedAt;
}
