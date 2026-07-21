package app.together.workflow.personal.dto;

import java.time.Instant;

public final class QuizSetDtos {

    private QuizSetDtos() {
    }

    public record ShareQuizSetRequest(
            String visibility
    ) {
    }

    public record QuizSetResponse(
            Long quizId,
            Long documentId,
            String ownerSso,
            String title,
            String description,
            String difficulty,
            Integer timeLimitMinutes,
            Integer passingScore,
            Boolean isRandomized,
            Boolean showAnswers,
            String visibility,
            String source,
            Instant sharedAt,
            long questionCount,
            boolean ownedByCurrentUser
    ) {
    }
}
