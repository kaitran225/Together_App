package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "mindmaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Mindmap extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mindmap_id")
    @EqualsAndHashCode.Include
    Long mindmapId;

    @Column(name = "document_id")
    Long documentId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(nullable = false)
    String title;

    @Column(nullable = false, columnDefinition = "jsonb")
    String content;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    String thumbnailUrl;
}
