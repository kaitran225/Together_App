package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "quick_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class QuickNote extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    @EqualsAndHashCode.Include
    Long noteId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @Column(name = "is_pinned")
    Boolean isPinned;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    String tags;

    @Column(name = "linked_to_type")
    String linkedToType;

    @Column(name = "linked_to_id")
    @EqualsAndHashCode.Include
    Long linkedToId;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
