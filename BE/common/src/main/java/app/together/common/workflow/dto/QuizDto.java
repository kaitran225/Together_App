package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record QuizDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long quizId,
        Long documentId,
        String userSso,
        String title,
        String description,
        String difficulty,
        Integer timeLimitMinutes,
        Integer passingScore,
        Boolean isRandomized,
        Boolean showAnswers,
        String visibility,
        String source,
        Instant sharedAt
) {
}
