package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "task_dependencies")
@IdClass(TaskDependencyId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class TaskDependency extends BaseAuditEntity {

    @Id
    @Column(name = "task_id", nullable = false)
    @EqualsAndHashCode.Include
    Long taskId;

    @Id
    @Column(name = "depends_on_task_id", nullable = false)
    @EqualsAndHashCode.Include
    Long dependsOnTaskId;

    @Column(name = "dependency_type")
    String dependencyType;
}
