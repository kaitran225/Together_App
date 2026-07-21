package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record QuizAttemptDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long attemptId,
        Long quizId,
        String userSso,
        BigDecimal score,
        Boolean isCorrect,
        Integer pointsEarned,
        Integer pointsPossible,
        Integer timeSpentSeconds,
        String status,
        Instant startedAt,
        Instant completedAt
) {
}
