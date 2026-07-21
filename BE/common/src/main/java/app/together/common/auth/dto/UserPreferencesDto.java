package app.together.common.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserPreferencesDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long userId,
        Boolean emailEnabled,
        Boolean pushEnabled,
        Boolean roomUpdates,
        Boolean taskUpdates,
        Boolean meetingReminders,
        Boolean quizReminders,
        Boolean achievements,
        Boolean marketing,
        String language,
        String timezone,
        String theme
) {
}
