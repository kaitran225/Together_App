package app.together.workflow.team.dto;

import java.math.BigDecimal;
import java.time.Instant;

public final class TaskSubmissionDtos {

    public TaskSubmissionDtos() {
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
            String attachments // JSON danh sách tệp đính kèm
    ) {
    }

    public record EvaluateTaskRequest(
            BigDecimal grade, // điểm sô
            String feedback, // nhận xét
            String status // trạng thái sau khi đánh giá (ví dụ: "GRADED", "REJECTED", "NEEDS_REVISION"
    ) {
    }
}
