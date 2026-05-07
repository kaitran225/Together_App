package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Schedule extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    @EqualsAndHashCode.Include
    Long scheduleId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(name = "category_id")
    Long categoryId;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "location")
    String location;

    @Column(name = "start_time", nullable = false)
    Instant startTime;

    @Column(name = "end_time", nullable = false)
    Instant endTime;

    @Column(name = "is_all_day")
    Boolean isAllDay = false;

    @Column(name = "timezone")
    String timezone;

    @Column(name = "is_recurring")
    Boolean isRecurring = false;

    @Column(name = "recurrence_rule", columnDefinition = "TEXT")
    String recurrenceRule;

    @Column(name = "recurrence_end_date")
    LocalDate recurrenceEndDate;

    @Column(name = "source")
    String source;

    @Column(name = "external_id")
    @EqualsAndHashCode.Include
    String externalId;

    @Column(name = "reminder_minutes", columnDefinition = "integer[]")
    String reminderMinutes;

    @Column(name = "status")
    String status;

    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Column(name = "deleted_at")
    Instant deletedAt;
}
