package app.together.workflow.personal.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.Quiz;
import app.together.common.workflow.entity.QuizAttempt;
import app.together.common.workflow.entity.QuizQuestion;
import app.together.common.workflow.repository.QuizAttemptRepository;
import app.together.common.workflow.repository.QuizQuestionRepository;
import app.together.common.workflow.repository.QuizRepository;
import app.together.workflow.personal.dto.QuizAttemptDtos.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class QuizAttemptService {

    private static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    private static final String STATUS_COMPLETED = "COMPLETED";

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Bắt đầu làm bài quiz - tạo một QuizAttempt mới với status IN_PROGRESS
     */
    public QuizAttemptResponse startQuizAttempt(String userSso, StartQuizAttemptRequest request) {
        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(
                        () -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUIZ_NOT_FOUND, request.quizId()));

        if (quiz.getDeletedAt() != null) {
            throw new BadRequestException(MessageConstants.MESSAGE_QUIZ_NOT_FOUND);
        }

        // Chỉ cho phép người sở hữu quiz hoặc quiz public mới được làm
        if (!quiz.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        // Lấy tổng điểm có thể đạt được
        List<QuizQuestion> questions = quizQuestionRepository.findByQuizId(quiz.getQuizId());
        int totalPointsPossible = questions.stream()
                .mapToInt(q -> q.getPoints() != null ? q.getPoints() : 1)
                .sum();

        QuizAttempt attempt = QuizAttempt.builder()
                .quizId(quiz.getQuizId())
                .userSso(userSso)
                .status(STATUS_IN_PROGRESS)
                .pointsPossible(totalPointsPossible)
                .pointsEarned(0)
                .startedAt(Instant.now())
                .build();

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return toAttemptResponse(saved);
    }

    /**
     * Nộp bài quiz - chấm điểm tự động và lưu kết quả
     */
    public QuizResultResponse submitQuizAttempt(Long attemptId, String userSso,
            SubmitQuizAttemptRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUIZ_ATTEMPT_NOT_FOUND,
                                attemptId));

        if (!attempt.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        if (STATUS_COMPLETED.equals(attempt.getStatus())) {
            throw new BadRequestException(MessageConstants.MESSAGE_QUIZ_ATTEMPT_INVALID);
        }

        Quiz quiz = quizRepository.findById(attempt.getQuizId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUIZ_NOT_FOUND,
                        attempt.getQuizId()));

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizId(quiz.getQuizId());
        Map<Long, QuizQuestion> questionMap = questions.stream()
                .collect(Collectors.toMap(QuizQuestion::getQuestionId, Function.identity()));

        // Chấm điểm từng câu
        int totalPointsEarned = 0;
        int totalPointsPossible = 0;
        List<QuestionResult> results = new ArrayList<>();

        if (request.answers() != null) {
            for (AnswerSubmission answer : request.answers()) {
                QuizQuestion question = questionMap.get(answer.questionId());
                if (question == null) {
                    continue;
                }

                int questionPoints = question.getPoints() != null ? question.getPoints() : 1;
                totalPointsPossible += questionPoints;

                boolean correct = question.getCorrectAnswer() != null
                        && question.getCorrectAnswer().trim().equalsIgnoreCase(
                                answer.selectedAnswer() != null ? answer.selectedAnswer().trim() : "");

                if (correct) {
                    totalPointsEarned += questionPoints;
                }

                results.add(new QuestionResult(
                        question.getQuestionId(),
                        question.getQuestionText(),
                        answer.selectedAnswer(),
                        question.getCorrectAnswer(),
                        correct,
                        question.getExplanation(),
                        questionPoints));
            }
        }

        // Tính điểm phần trăm
        BigDecimal score = totalPointsPossible > 0
                ? BigDecimal.valueOf(totalPointsEarned)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalPointsPossible), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Tính thời gian làm bài
        Instant now = Instant.now();
        int timeSpentSeconds = (int) Duration.between(attempt.getStartedAt(), now).getSeconds();

        // Lưu userAnswer dưới dạng JSON
        try {
            attempt.setUserAnswer(objectMapper.writeValueAsString(request.answers()));
        } catch (Exception e) {
            log.warn("Failed to serialize user answers: {}", e.getMessage());
        }

        attempt.setScore(score);
        attempt.setPointsEarned(totalPointsEarned);
        attempt.setPointsPossible(totalPointsPossible > 0 ? totalPointsPossible : attempt.getPointsPossible());
        attempt.setTimeSpentSeconds(timeSpentSeconds);
        attempt.setStatus(STATUS_COMPLETED);
        attempt.setCompletedAt(now);
        attempt.setIsCorrect(score.compareTo(BigDecimal.valueOf(quiz.getPassingScore())) >= 0);

        quizAttemptRepository.save(attempt);

        // Phát sự kiện hoàn thành quiz để hệ thống gamification cộng streak
        boolean passed = quiz.getPassingScore() != null
                && score.compareTo(BigDecimal.valueOf(quiz.getPassingScore())) >= 0;

        eventPublisher.publishEvent(new app.together.workflow.room.event.StudySessionCompletedEvent(
                userSso,
                Math.max(1, timeSpentSeconds / 60),
                now));

        return new QuizResultResponse(
                attempt.getAttemptId(),
                attempt.getQuizId(),
                score,
                totalPointsEarned,
                attempt.getPointsPossible(),
                passed,
                timeSpentSeconds,
                results);
    }

    /**
     * Lấy lịch sử các lần làm quiz
     */
    @Transactional(readOnly = true)
    public List<QuizAttemptHistoryResponse> getAttemptHistory(Long quizId, String userSso) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUIZ_NOT_FOUND, quizId));

        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizIdAndUserSso(quizId, userSso);

        return attempts.stream()
                .map(a -> new QuizAttemptHistoryResponse(
                        a.getAttemptId(),
                        a.getQuizId(),
                        quiz.getTitle(),
                        a.getScore(),
                        a.getPointsEarned(),
                        a.getPointsPossible(),
                        a.getStatus(),
                        a.getStartedAt(),
                        a.getCompletedAt()))
                .toList();
    }

    /**
     * Lấy chi tiết kết quả của một lần làm quiz
     */
    @Transactional(readOnly = true)
    public QuizAttemptResponse getAttemptDetail(Long attemptId, String userSso) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUIZ_ATTEMPT_NOT_FOUND,
                                attemptId));

        if (!attempt.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        return toAttemptResponse(attempt);
    }

    private QuizAttemptResponse toAttemptResponse(QuizAttempt attempt) {
        return new QuizAttemptResponse(
                attempt.getAttemptId(),
                attempt.getQuizId(),
                attempt.getUserSso(),
                attempt.getScore(),
                attempt.getPointsEarned(),
                attempt.getPointsPossible(),
                attempt.getTimeSpentSeconds(),
                attempt.getStatus(),
                attempt.getStartedAt(),
                attempt.getCompletedAt());
    }
}
