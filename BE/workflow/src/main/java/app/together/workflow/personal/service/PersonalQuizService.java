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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.swing.*;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PersonalQuizService {

    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final AiServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    private String prompt = "Hãy tạo một bộ đề trắc nghiệm ôn tập.";

    /*
     * Gọi AI Service để sinh trắc nghiệm tự động từ người dùng
     * */
    public Quiz generateQuizFromDocument(String userSso, GenerateQuizRequest request) {
        Document document = documentRepository.findById(request.documentId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_DOCUMENT_NOT_FOUND, request.documentId()));

        if (!document.getUserSso().equals(userSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        // Định dạng tin nhắn gửi sang AI.
        String aiPrompt = request.prompt() != null ? request.prompt().trim() : prompt;

        // Gửi nội dung kèm token/đường dẫn của tài liệu sang AI Service
        AiServiceResponse aiResponse = aiServiceClient.getMessageWithAttachments(
                aiPrompt,
                List.of(document.getFilePath())
        );

        // Kiểm tra xem AI Tool Agent có nhận diện đúng công cụ sinh Quiz hay không
        if (!ActionType.CREATION.name().equalsIgnoreCase(aiResponse.actionTaken()) || aiResponse.actionMetadata() == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_AI_NOT_FOUND);
        }

        try {
            // Sử dụng ObjectMapper để phân rã (parse) chuỗi JSON của Tool 'Create Quiz Json'
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
                    .build();
            Quiz savedQuiz = quizRepository.save(quiz);

            // 2. Phân rã mảng questions và lưu danh sách Câu hỏi (QuizQuestion)
            if(aiQuiz.questions() != null){
                int position = 1;
                for (var aiQuestion : aiQuiz.questions()){
                    // Chuyển đổi mảng Options sang chuỗi định dạng JSONB để lưu trữ
                    String optionJson = objectMapper.writeValueAsString(aiQuestion.options());

                    QuizQuestion question = QuizQuestion.builder()
                            .quizId(savedQuiz.getQuizId())
                            .questionType(aiQuestion.questionType() != null ? aiQuestion.questionType().trim().toUpperCase() : QuestionType.SINGLE_CHOICE.name())
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
}
