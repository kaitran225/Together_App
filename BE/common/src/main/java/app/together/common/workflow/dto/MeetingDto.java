package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record MeetingDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long meetingId,
        Long teamId,
        Long roomId,
        Long projectId,
        String title,
        String description,
        String agenda,
        String meetingUrl,
        String meetingPlatform,
        Instant scheduledStart,
        Instant scheduledEnd,
        Instant actualStart,
        Instant actualEnd,
        Integer maxDuration,
        String status
) {
}
