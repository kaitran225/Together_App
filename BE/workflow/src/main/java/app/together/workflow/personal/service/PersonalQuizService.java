package app.together.workflow.personal.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.Document;
import app.together.common.workflow.entity.Quiz;
import app.together.common.workflow.entity.QuizQuestion;
import app.together.common.workflow.enums.ActionType;
import app.together.common.workflow.enums.QuestionType;
import app.together.common.workflow.enums.QuizPriority;
import app.together.common.workflow.repository.DocumentRepository;
import app.together.common.workflow.repository.QuizQuestionRepository;
import app.together.common.workflow.repository.QuizRepository;
import app.together.workflow.personal.client.AiServiceClient;
import app.together.workflow.personal.dto.ChatDtos.*;
import app.together.workflow.personal.dto.QuizSetDtos.QuizSetResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PersonalQuizService {

    private static final String VISIBILITY_PRIVATE = "PRIVATE";
    private static final String VISIBILITY_PUBLIC = "PUBLIC";

    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    private String prompt = "Hãy tạo một bộ đề trắc nghiệm ôn tập.";

    /*
     * Gọi AI Service để sinh trắc nghiệm tự động từ người dùng
     */
    public Quiz generateQuizFromDocument(String userSso, GenerateQuizRequest request) {
        Document document = documentRepository.findById(request.documentId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_DOCUMENT_NOT_FOUND,
                        request.documentId()));

        if (!document.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        // Định dạng tin nhắn gửi sang AI.
        String aiPrompt = request.prompt() != null ? request.prompt().trim() : prompt;

        // Gửi nội dung kèm token/đường dẫn của tài liệu sang AI Service
        AiServiceResponse aiResponse = aiServiceClient.getMessageWithAttachments(
                aiPrompt,
                List.of(document.getFilePath()));

        // Kiểm tra xem AI Tool Agent có nhận diện đúng công cụ sinh Quiz hay không
        if (!ActionType.CREATION.name().equalsIgnoreCase(aiResponse.actionTaken())
                || aiResponse.actionMetadata() == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_AI_NOT_FOUND);
        }

        try {
            // Sử dụng ObjectMapper để phân rã (parse) chuỗi JSON của Tool 'Create Quiz
            // Json'
            AiQuizPayload aiQuiz = objectMapper.readValue(aiResponse.actionMetadata(), AiQuizPayload.class);

            // 1. Khởi tạo và lưu thực thể Đề thi (Quiz) vào Database
            Quiz quiz = Quiz.builder()
                    .documentId(request.documentId())
                    .userSso(userSso)
                    .title(aiQuiz.title() != null ? aiQuiz.title().trim() : "Đề ôn tập tự động")
                    .description(aiQuiz.description())
                    .difficulty(aiQuiz.difficulty() != null ? aiQuiz.difficulty().trim() : QuizPriority.MEDIUM.name())
                    .timeLimitMinutes(aiQuiz.timeLimitMinutes() != null ? aiQuiz.timeLimitMinutes() : 15)
                    .passingScore(80)
                    .isRandomized(false)
                    .showAnswers(true)
                    .visibility(VISIBILITY_PRIVATE)
                    .source("AI_GENERATED")
                    .build();
            Quiz savedQuiz = quizRepository.save(quiz);

            // 2. Phân rã mảng questions và lưu danh sách Câu hỏi (QuizQuestion)
            if (aiQuiz.questions() != null) {
                int position = 1;
                for (var aiQuestion : aiQuiz.questions()) {
                    // Chuyển đổi mảng Options sang chuỗi định dạng JSONB để lưu trữ
                    String optionJson = objectMapper.writeValueAsString(aiQuestion.options());

                    QuizQuestion question = QuizQuestion.builder()
                            .quizId(savedQuiz.getQuizId())
                            .questionType(
                                    aiQuestion.questionType() != null ? aiQuestion.questionType().trim().toUpperCase()
                                            : QuestionType.SINGLE_CHOICE.name())
                            .questionText(aiQuestion.questionText().trim())
                            .options(optionJson)
                            .correctAnswer(aiQuestion.correctAnswer().trim())
                            .explanation(aiQuestion.explanation())
                            .points(aiQuestion.points() != null ? aiQuestion.points() : 0)
                            .position(position++)
                            .build();
                    quizQuestionRepository.save(question);
                }
            }
            log.info("Successfully generated AI Quiz with ID: {} for user: {}", savedQuiz.getQuizId(), userSso);
            return savedQuiz;
        } catch (Exception ex) {
            log.error("Failed to parse and save AI generated quiz metadata: {}", ex.getMessage());
            throw new BadRequestException(MessageConstants.MESSAGE_FAILED_TO_PARSE_AI_GENERATED_QUIZ_METADATA);
        }
    }

    public List<QuizQuestion> getQuizQuestions(String userSso, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUIZ_NOT_FOUND, quizId));
        if (!canAccessQuiz(quiz, userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
        return quizQuestionRepository.findByQuizId(quizId);
    }

    @Transactional(readOnly = true)
    public List<QuizSetResponse> getAvailableQuizSets(String userSso, String keyword, String difficulty) {
        String normalizedKeyword = hasText(keyword) ? keyword.trim() : null;
        String normalizedDifficulty = hasText(difficulty) ? difficulty.trim().toUpperCase() : null;

        return quizRepository.findAvailableQuizSets(userSso, normalizedKeyword, normalizedDifficulty).stream()
                .map(quiz -> toQuizSetResponse(quiz, userSso))
                .toList();
    }

    public QuizSetResponse updateQuizSetSharing(String userSso, Long quizId, String visibility) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUIZ_NOT_FOUND, quizId));
        if (!quiz.getUserSso().equals(userSso) || quiz.getDeletedAt() != null) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        String normalizedVisibility = hasText(visibility) ? visibility.trim().toUpperCase() : VISIBILITY_PRIVATE;
        if (!VISIBILITY_PRIVATE.equals(normalizedVisibility) && !VISIBILITY_PUBLIC.equals(normalizedVisibility)) {
            throw new BadRequestException(MessageConstants.MESSAGE_INVALID);
        }

        quiz.setVisibility(normalizedVisibility);
        quiz.setSharedAt(VISIBILITY_PUBLIC.equals(normalizedVisibility) ? java.time.Instant.now() : null);
        return toQuizSetResponse(quizRepository.save(quiz), userSso);
    }

    private QuizSetResponse toQuizSetResponse(Quiz quiz, String currentUserSso) {
        String visibility = hasText(quiz.getVisibility()) ? quiz.getVisibility() : VISIBILITY_PRIVATE;
        String source = hasText(quiz.getSource()) ? quiz.getSource() : "USER_GENERATED";
        return new QuizSetResponse(
                quiz.getQuizId(),
                quiz.getDocumentId(),
                quiz.getUserSso(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getDifficulty(),
                quiz.getTimeLimitMinutes(),
                quiz.getPassingScore(),
                quiz.getIsRandomized(),
                quiz.getShowAnswers(),
                visibility,
                source,
                quiz.getSharedAt(),
                quizQuestionRepository.countByQuizId(quiz.getQuizId()),
                quiz.getUserSso().equals(currentUserSso)
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean canAccessQuiz(Quiz quiz, String userSso) {
        return quiz.getDeletedAt() == null
                && (quiz.getUserSso().equals(userSso) || VISIBILITY_PUBLIC.equalsIgnoreCase(quiz.getVisibility()));
    }
}
