package app.together.workflow.team.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.cglib.core.Local;

public final class TaskDtos {

    private TaskDtos() {}

    public record TaskDetailsResponse(
        Long taskId,
        Long projectId,
        Long teamId,
        Long roomId,
        Long parentTaskId,
        String title,
        String description,
        String status,
        String priority,
        BigDecimal estimatedHours,
        BigDecimal actualHours,
        LocalDate startDate,
        LocalDate dueDate,
        Instant completeAt,
        Long columnId,
        Long sprintId,
        List<String> assigness,
        List<TaskDependencyResponse> dependencies,
        List<TaskCommentResponse> comments,
        List<TaskAttachmentResponse> attachments
    ) {
    }

    public record TaskDependencyResponse(
        Long dependsOnTaskId,
        String dependencyType
    ) {
    }

    public record TaskCommentResponse(
        Long commentId,
        String userSso,
        String content,
        String attachments,
        Instant createdAt
    ){
    }

    public record TaskAttachmentResponse(
        Long attachmentId,
        String attachmentType,
        String title,
        String url,
        String uploadedBy,
        Instant uploadedAt
    ) {
    }

    public record CreateTaskRequest(
        String title,
        String description,
        String priority,
        BigDecimal estimatedHours,
        LocalDate startDate,
        LocalDate dueDate,
        Long parentTaskId,
        Long sprintId,
        Long columnId
    ) {
    }

    public record AssignTaskRequest(
        String targetUserSso
    ) {
    }

    public record AddTaskDependencyRequest(
        Long dependsOnTaskId,
        String dependencyType
    ) {
    }

    public record AddTaskCommentRequest(
        String content,
        String attachments
    ){
    }

    public record AddAttachmentRequest(
        String title,
        String url,
        String attachmentType
    ) {
    }

    public record UpdateTaskRequest(
        String title,
        String description,
        String priority,
        LocalDate startDate,
        LocalDate dueDate,
        Instant completedAt,
        String status
    ) {
    }
}
