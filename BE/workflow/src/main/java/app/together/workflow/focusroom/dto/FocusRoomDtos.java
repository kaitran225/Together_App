package app.together.workflow.focusroom.dto;

import lombok.Builder;

import java.time.LocalDateTime;

public class FocusRoomDtos {

    @Builder
    public record FocusRoomTaskResponse(
            Long id,
            String title,
            LocalDateTime dueDate,
            boolean isCompleted
    ) {}

    @Builder
    public record CreateFocusRoomTaskRequest(
            String title,
            LocalDateTime dueDate
    ) {}

    @Builder
    public record UpdateFocusRoomTaskRequest(
            String title,
            LocalDateTime dueDate,
            Boolean isCompleted
    ) {}
}
