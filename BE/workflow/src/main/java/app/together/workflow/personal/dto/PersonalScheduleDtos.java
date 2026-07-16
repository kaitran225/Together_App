package app.together.workflow.personal.dto;

import java.time.Instant;

public class PersonalScheduleDtos {
    private PersonalScheduleDtos() {
    }

    public record ScheduleResponse(
            Long scheduleId,
            String title,
            String description,
            Instant startTime,
            Instant endTime,
            Boolean isAllDay,
            String location,
            Long categoryId
    ) {
    }

    public record CreateScheduleRequest(
            Long categoryId,
            String title,
            String description,
            Instant startTime,
            Instant endTime,
            Boolean isAllDay,
            String location
    ) {
    }

    public record CategoryResponse(
            Long categoryId,
            String name,
            String color,
            String icon
    ) {
    }

    public record CreateCategoryRequest(
            String name,
            String color,
            String icon
    ) {
    }

    public record ScheduleAssistRequest(
            String prompt
    ) {
    }

    public record ScheduleAssistResponse(
            String reply,
            ScheduleResponse created
    ) {
    }
}
