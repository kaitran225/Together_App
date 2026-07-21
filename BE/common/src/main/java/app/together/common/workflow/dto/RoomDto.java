package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record RoomDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long roomId,
        String title,
        String description,
        String goalDescription,
        Integer goalDurationDays,
        Integer maxMembers,
        Boolean isPremium,
        Boolean isPublic,
        String inviteCode,
        String status,
        Instant activatedAt,
        Instant expiresAt
) {
}
