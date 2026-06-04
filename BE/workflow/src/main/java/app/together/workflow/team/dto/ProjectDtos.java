package app.together.workflow.team.dto;

import java.time.Instant;
import java.time.LocalDate;

public final class ProjectDtos {

    private ProjectDtos() {}

    public record ProjectResponse(
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

    public record CreateProjectRequest(
        String name, 
        String description,
        LocalDate startDate,
        LocalDate dueDate
    ) {
    }

    public record UpdateProjectRequest(
        String name, 
        String description,
        String status,
        LocalDate startDate,
        LocalDate dueDate
    ) {
    }
}
