package app.together.workflow.team.dto;

import java.math.BigDecimal;
import java.time.Instant;

public final class TaskSubmissionDtos {

    private TaskSubmissionDtos() {
    }

    public record TaskSubmissionResponse(
            Long submissionId,
            Long taskId,
            String userSso,
            String content,
            String attachments,
            BigDecimal grade,
            String feedback,
            String status,
            Instant submittedAt
    ) {
    }

    public record SubmitTaskRequest(
            String content,
            String attachments // JSON danh sách tệp đính kèm
    ) {
    }

    public record EvaluateTaskRequest(
            BigDecimal grade,
            String feedback,
            String status // PENDING | APPROVED | REJECTED
    ) {
    }
}
