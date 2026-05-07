package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "task_assignments")
@IdClass(TaskAssignmentId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class TaskAssignment extends BaseAuditEntity {

    @Id
    @Column(name = "task_id", nullable = false)
    @EqualsAndHashCode.Include
    Long taskId;

    @Id
    @Column(name = "user_sso", nullable = false)
    @EqualsAndHashCode.Include
    String userSso;

    @Column(name = "assigned_by")
    String assignedBy;

    @Column(name = "assigned_at")
    Instant assignedAt;

    @Column(name = "accepted_at")
    Instant acceptedAt;
}
