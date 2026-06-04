package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "sprints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Sprint extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sprint_id")
    @EqualsAndHashCode.Include
    Long sprintId;

    @Column(name = "project_id", nullable = false)
    Long projectId;

    @Column(nullable = false)
    String name; // Ví dụ: "Sprint 1", "Sprint 2"

    @Column(name = "goal", columnDefinition = "TEXT")
    String goal; // Mục tiêu của chu kỳ này

    @Column(name = "start_date")
    LocalDate startDate;

    @Column(name = "end_date")
    LocalDate endDate;

    @Column(name = "status")
    String status; 

    @Column(name = "completed_at")
    Instant completedAt;

}
