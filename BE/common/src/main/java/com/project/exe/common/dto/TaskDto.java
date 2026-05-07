package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class TaskDto {
    Long taskId;
    Long projectId;
    Long teamId;
    Long roomId;
    Long parentTaskId;
    @NotBlank(message = "title required")
    @Size(max = 500)
    String title;
    @Size(max = 5000)
    String description;
    String status;
    String priority;
    BigDecimal estimatedHours;
    BigDecimal actualHours;
    LocalDate startDate;
    LocalDate dueDate;
    Instant completedAt;
    String createdBy;

}
