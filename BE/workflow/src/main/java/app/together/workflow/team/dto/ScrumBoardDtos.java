package app.together.workflow.team.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ScrumBoardDtos {

    private ScrumBoardDtos() {
    }

    public record ScrumBoardResponse(
            Long projectId,
            String projectName,
            List<BoardColumnResponse> boardColumns) {
    }

    public record BoardColumnResponse(
            Long columnId,
            Long projectId,
            String name,
            Integer position,
            String colorCode,
            List<TaskSummaryResponse> tasks) {
    }

    public record TaskSummaryResponse(
            Long taskId,
            String title,
            String description,
            String status,
            String priority,
            BigDecimal estimatedHours,
            BigDecimal actualHours,
            LocalDate duDate,
            Long sprintId) {
    }

    public record MoveTaskRequest(
            Long targetColumnId) {
    }

    public record CreateColumnRequest(
            String name,
            Integer position,
            String colorCode) {
    }

}
