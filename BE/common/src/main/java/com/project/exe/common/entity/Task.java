package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Task extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    @EqualsAndHashCode.Include
    Long taskId;

    @Column(name = "project_id")
    Long projectId;

    @Column(name = "team_id")
    Long teamId;

    @Column(name = "room_id")
    Long roomId;

    @Column(name = "parent_task_id")
    Long parentTaskId;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "status")
    String status;

    @Column(name = "priority")
    String priority;

    @Column(name = "estimated_hours", precision = 10, scale = 2)
    BigDecimal estimatedHours;

    @Column(name = "actual_hours", precision = 10, scale = 2)
    BigDecimal actualHours;

    @Column(name = "start_date")
    LocalDate startDate;

    @Column(name = "due_date")
    LocalDate dueDate;

    @Column(name = "completed_at")
    Instant completedAt;

    @Column(name = "attachments", columnDefinition = "jsonb")
    String attachments;

    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
