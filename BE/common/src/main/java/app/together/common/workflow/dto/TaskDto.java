package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record TaskDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long taskId,
        Long projectId,
        Long teamId,
        Long roomId,
        Long parentTaskId,
        @NotBlank(message = "title required")
        @Size(max = 500)
        String title,
        @Size(max = 5000)
        String description,
        String status,
        String priority,
        BigDecimal estimatedHours,
        BigDecimal actualHours,
        LocalDate startDate,
        LocalDate dueDate,
        Instant completedAt
) {
}
