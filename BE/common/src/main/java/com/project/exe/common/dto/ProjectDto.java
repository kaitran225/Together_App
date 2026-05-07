package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectDto {
    Long projectId;
    Long teamId;
    String name;
    String description;
    String status;
    LocalDate startDate;
    LocalDate dueDate;
    Instant completedAt;
    String createdBy;

}
