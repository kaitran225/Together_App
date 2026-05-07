package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "schedule_exceptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class ScheduleException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exception_id")
    @EqualsAndHashCode.Include
    Long exceptionId;

    @Column(name = "schedule_id", nullable = false)
    @EqualsAndHashCode.Include
    Long scheduleId;

    @Column(name = "exception_date", nullable = false)
    LocalDate exceptionDate;

    @Column(name = "is_cancelled")
    Boolean isCancelled = false;

    @Column(name = "new_start_time")
    Instant newStartTime;

    @Column(name = "new_end_time")
    Instant newEndTime;

    @Column(name = "created_at")
    Instant createdAt;

    @Column(name = "created_by")
    String createdBy;

    @Column(name = "updated_at")
    Instant updatedAt;

    @Column(name = "updated_by")
    String updatedBy;
}
