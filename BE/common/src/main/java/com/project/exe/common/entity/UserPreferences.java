package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class UserPreferences extends BaseAuditEntity {

    @Id
    @Column(name = "user_id")
    @EqualsAndHashCode.Include
    Long userId;

    @Column(name = "email_enabled")
    Boolean emailEnabled = true;

    @Column(name = "push_enabled")
    Boolean pushEnabled = true;

    @Column(name = "room_updates")
    Boolean roomUpdates = true;

    @Column(name = "task_updates")
    Boolean taskUpdates = true;

    @Column(name = "meeting_reminders")
    Boolean meetingReminders = true;

    @Column(name = "quiz_reminders")
    Boolean quizReminders = true;

    @Column(name = "achievements")
    Boolean achievements = true;

    @Column(name = "marketing")
    Boolean marketing = false;

    @Column(name = "language")
    String language;

    @Column(name = "timezone")
    String timezone;

    @Column(name = "theme")
    String theme;

    @Column(name = "settings_json", columnDefinition = "jsonb")
    String settingsJson;

    @Column(name = "unlocked_features", columnDefinition = "jsonb")
    String unlockedFeatures;
}
