package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.time.LocalDate;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long projectId,
        Long teamId,
        String name,
        String description,
        String status,
        LocalDate startDate,
        LocalDate dueDate,
        Instant completedAt
) {
}
