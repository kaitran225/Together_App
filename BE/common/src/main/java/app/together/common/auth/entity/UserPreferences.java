package app.together.common.auth.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "user_preferences", schema = "auth")
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
    Boolean emailEnabled;

    @Column(name = "push_enabled")
    Boolean pushEnabled;

    @Column(name = "room_updates")
    Boolean roomUpdates;

    @Column(name = "task_updates")
    Boolean taskUpdates;

    @Column(name = "meeting_reminders")
    Boolean meetingReminders;

    @Column(name = "quiz_reminders")
    Boolean quizReminders;

    @Column(name = "achievements")
    Boolean achievements;

    @Column(name = "marketing")
    Boolean marketing;

    @Column(name = "language")
    String language;

    @Column(name = "timezone")
    String timezone;

    @Column(name = "theme")
    String theme;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "settings_json", columnDefinition = "jsonb")
    String settingsJson;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "unlocked_features", columnDefinition = "jsonb")
    String unlockedFeatures;
}
