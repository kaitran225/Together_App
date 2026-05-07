package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "meeting_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class MeetingNote extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    @EqualsAndHashCode.Include
    Long noteId;

    @Column(name = "meeting_id", nullable = false)
    @EqualsAndHashCode.Include
    Long meetingId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @Column(name = "is_shared")
    Boolean isShared = false;
}
