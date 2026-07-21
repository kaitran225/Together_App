package app.together.workflow.personal.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class QuizAttemptDtos {

    // ── Request DTOs ──

    /**
     * Bắt đầu làm bài quiz - tạo một attempt mới
     */
    public record StartQuizAttemptRequest(
            Long quizId) {
    }

    /**
     * Nộp bài quiz - gửi toàn bộ câu trả lời
     */
    public record SubmitQuizAttemptRequest(
            List<AnswerSubmission> answers) {
    }

    /**
     * Một câu trả lời cho 1 câu hỏi
     */
    public record AnswerSubmission(
            Long questionId,
            String selectedAnswer) {
    }

    // ── Response DTOs ──

    public record QuizAttemptResponse(
            Long attemptId,
            Long quizId,
            String userSso,
            BigDecimal score,
            Integer pointsEarned,
            Integer pointsPossible,
            Integer timeSpentSeconds,
            String status,
            Instant startedAt,
            Instant completedAt) {
    }

    public record QuizResultResponse(
            Long attemptId,
            Long quizId,
            BigDecimal score,
            Integer pointsEarned,
            Integer pointsPossible,
            boolean passed,
            Integer timeSpentSeconds,
            List<QuestionResult> results) {
    }

    public record QuestionResult(
            Long questionId,
            String questionText,
            String selectedAnswer,
            String correctAnswer,
            boolean isCorrect,
            String explanation,
            Integer points) {
    }

    public record QuizAttemptHistoryResponse(
            Long attemptId,
            Long quizId,
            String quizTitle,
            BigDecimal score,
            Integer pointsEarned,
            Integer pointsPossible,
            String status,
            Instant startedAt,
            Instant completedAt) {
    }
}
