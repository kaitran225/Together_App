package app.together.workflow.personal.service.ai;

import app.together.common.workflow.entity.Document;
import app.together.common.workflow.entity.Mindmap;
import app.together.common.workflow.entity.Quiz;
import app.together.common.workflow.entity.QuizQuestion;
import app.together.common.workflow.entity.Summary;
import app.together.common.workflow.enums.ProcessingStatus;
import app.together.common.workflow.repository.DocumentRepository;
import app.together.common.workflow.repository.FlashcardRepository;
import app.together.common.workflow.repository.MindmapRepository;
import app.together.common.workflow.repository.QuizQuestionRepository;
import app.together.common.workflow.repository.QuizRepository;
import app.together.common.workflow.repository.SummaryRepository;
import app.together.workflow.personal.dto.ChatDtos.AiQuizPayload;
import app.together.workflow.personal.dto.ChatDtos.AiQuizQuestions;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Worker xử lý bất đồng bộ cho việc trích xuất text từ tài liệu và gọi AI.
 * <p>
 * Quy trình đầy đủ khi upload PDF:
 * 1. Trích xuất text từ file PDF (PdfExtractionService)
 * 2. Gọi Ollama (Qwen2.5:3b) để tạo Mindmap tự động
 * 3. Gọi Ollama (Qwen2.5:3b) để tạo Summary (tóm tắt)
 * 4. Gọi Ollama (Qwen2.5:3b) để tạo Quiz + Flashcard tự động
 * 5. Cập nhật trạng thái Document thành COMPLETED hoặc FAILED
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentProcessingWorker {

    private static final String MODEL_USED = "qwen2.5:3b";

    private final PdfExtractionService pdfExtractionService;
    private final OllamaAiService ollamaAiService;
    private final DocumentRepository documentRepository;
    private final MindmapRepository mindmapRepository;
    private final SummaryRepository summaryRepository;
    private final QuizRepository quizRepository;
    private final FlashcardRepository flashcardRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Xử lý tài liệu ở background thread.
     * Annotation @Async đảm bảo method này chạy trên thread pool riêng,
     * không block API upload.
     *
     * @param documentId ID của tài liệu vừa được upload
     */
    @Async
    @Transactional
    public void processDocumentAsync(Long documentId) {
        log.info("========================================");
        log.info("Bắt đầu xử lý bất đồng bộ cho document ID: {}", documentId);
        log.info("========================================");

        Document document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.error("Không tìm thấy document với ID: {}", documentId);
            return;
        }

        try {
            // ===== BƯỚC 1/5: Trích xuất text từ file PDF =====
            log.info("[Bước 1/5] Trích xuất text từ file: {}", document.getFileName());
            PdfExtractionService.ExtractionResult extraction = pdfExtractionService
                    .extractTextFromPdf(document.getFilePath());

            document.setExtractedText(extraction.text());
            document.setPageCount(extraction.pageCount());
            document.setWordCount(extraction.wordCount());
            documentRepository.save(document);
            log.info("[Bước 1/5] Hoàn tất trích xuất: {} trang, {} từ", extraction.pageCount(), extraction.wordCount());

            String extractedText = extraction.text();

            // ===== BƯỚC 2: Tạo Mindmap bằng AI =====
            generateMindmap(document, extractedText);

            // ===== BƯỚC 3: Tạo Summary (tóm tắt) bằng AI =====
            generateSummary(document, extractedText);

            // ===== BƯỚC 4: Tạo Quiz bằng AI =====
            generateQuiz(document, extractedText);

            // ===== BƯỚC 5: Tạo Flashcard riêng bằng AI =====
            generateFlashcards(document, extractedText);

            // ===== HOÀN TẤT: Cập nhật trạng thái thành công =====
            document.setProcessingStatus(ProcessingStatus.COMPLETED.toString());
            document.setErrorMessage(null);
            documentRepository.save(document);

            log.info("========================================");
            log.info("Hoàn tất xử lý document ID: {} thành công!", documentId);
            log.info("========================================");

        } catch (Exception e) {
            log.error("Xử lý document ID: {} thất bại", documentId, e);
            handleProcessingFailure(documentId, e.getMessage());
        }
    }

    /**
     * Bước 2: Gọi Ollama tạo Mindmap JSON và lưu vào bảng mindmaps.
     */
    private void generateMindmap(Document document, String extractedText) {
        try {
            log.info("[Bước 2/5] Đang gửi nội dung tới Ollama để tạo Mindmap...");
            String mindmapJson = ollamaAiService.generateMindmapFromText(extractedText);

            Mindmap mindmap = Mindmap.builder()
                    .documentId(document.getDocumentId())
                    .userSso(document.getUserSso())
                    .title("Mindmap - " + document.getTitle())
                    .content(mindmapJson)
                    .build();
            mindmapRepository.save(mindmap);
            log.info("[Bước 2/5] Tạo Mindmap thành công.");
        } catch (Exception e) {
            // Không throw lỗi, để tiếp tục các bước tiếp theo
            log.warn("[Bước 2/5] Tạo Mindmap thất bại (không ảnh hưởng các bước khác): {}", e.getMessage());
        }
    }

    /**
     * Bước 3: Gọi Ollama tóm tắt tài liệu và lưu vào bảng summaries.
     */
    private void generateSummary(Document document, String extractedText) {
        try {
            log.info("[Bước 3/5] Đang gửi nội dung tới Ollama để tạo Summary...");
            String summaryText = ollamaAiService.summarizeText(extractedText);

            Summary summary = Summary.builder()
                    .documentId(document.getDocumentId())
                    .summaryType("GENERAL")
                    .content(summaryText)
                    .modelUsed(MODEL_USED)
                    .generatedAt(Instant.now())
                    .build();
            summaryRepository.save(summary);
            log.info("[Bước 3/5] Tạo Summary thành công.");
        } catch (Exception e) {
            log.warn("[Bước 3/5] Tạo Summary thất bại (không ảnh hưởng các bước khác): {}", e.getMessage());
        }
    }

    /**
     * Bước 4: Gọi Ollama tạo bộ Quiz trắc nghiệm, parse JSON và lưu vào bảng
     * quizzes + quiz_questions.
     */
    private void generateQuiz(Document document, String extractedText) {
        try {
            log.info("[Bước 4/5] Đang gửi nội dung tới Ollama để tạo Quiz...");
            String quizJson = ollamaAiService.generateQuizFromText(extractedText);

            // Loại bỏ markdown code block nếu model trả về dạng ```json ... ```
            quizJson = cleanJsonResponse(quizJson);

            AiQuizPayload aiQuiz = objectMapper.readValue(quizJson, AiQuizPayload.class);

            // Lưu Quiz
            Quiz quiz = Quiz.builder()
                    .documentId(document.getDocumentId())
                    .userSso(document.getUserSso())
                    .title(aiQuiz.title() != null ? aiQuiz.title().trim() : "Quiz - " + document.getTitle())
                    .description((aiQuiz.description() != null ? aiQuiz.description() : "") + " (Tạo từ file: "
                            + document.getTitle() + ")")
                    .difficulty(aiQuiz.difficulty() != null ? aiQuiz.difficulty().trim() : "MEDIUM")
                    .timeLimitMinutes(aiQuiz.timeLimitMinutes() != null ? aiQuiz.timeLimitMinutes() : 15)
                    .passingScore(80)
                    .isRandomized(false)
                    .showAnswers(true)
                    .visibility("PRIVATE")
                    .source("AI_GENERATED")
                    .build();
            Quiz savedQuiz = quizRepository.save(quiz);

            // Lưu từng câu hỏi (QuizQuestion) — cũng đồng thời là dữ liệu Flashcard
            if (aiQuiz.questions() != null) {
                int position = 1;
                for (AiQuizQuestions aiQuestion : aiQuiz.questions()) {
                    String optionJson = objectMapper.writeValueAsString(aiQuestion.options());

                    QuizQuestion question = QuizQuestion.builder()
                            .quizId(savedQuiz.getQuizId())
                            .questionType(aiQuestion.questionType() != null
                                    ? aiQuestion.questionType().trim().toUpperCase()
                                    : "SINGLE_CHOICE")
                            .questionText(aiQuestion.questionText() != null ? aiQuestion.questionText().trim()
                                    : "Câu hỏi bị trống")
                            .options(optionJson)
                            .correctAnswer(aiQuestion.correctAnswer() != null ? aiQuestion.correctAnswer().trim() : "")
                            .explanation(aiQuestion.explanation())
                            .points(aiQuestion.points() != null ? aiQuestion.points() : 10)
                            .position(position++)
                            .build();
                    quizQuestionRepository.save(question);
                }
            }

            log.info("[Bước 4/5] Tạo Quiz thành công: {} câu hỏi (Quiz ID: {})",
                    aiQuiz.questions() != null ? aiQuiz.questions().size() : 0,
                    savedQuiz.getQuizId());
        } catch (Exception e) {
            log.warn("[Bước 4/5] Tạo Quiz thất bại (không ảnh hưởng trạng thái document): {}", e.getMessage());
            log.debug("[Bước 4/5] Trace lỗi:", e);
        }
    }

    /**
     * Bước 5: Gọi Ollama tạo bộ Flashcard riêng (khác với Quiz).
     * Flashcard tập trung vào ôn tập kiến thức cốt lõi với câu hỏi ngắn gọn.
     */
    private void generateFlashcards(Document document, String extractedText) {
        try {
            log.info("[Bước 5/5] Đang gửi nội dung tới Ollama để tạo Flashcard...");
            String flashcardJson = ollamaAiService.generateFlashcardsFromText(extractedText);

            flashcardJson = cleanJsonResponse(flashcardJson);

            AiQuizPayload aiFlashcard = objectMapper.readValue(flashcardJson, AiQuizPayload.class);

            // Lưu Flashcard set dưới dạng Quiz với source = FLASHCARD
            Quiz flashcardQuiz = Quiz.builder()
                    .documentId(document.getDocumentId())
                    .userSso(document.getUserSso())
                    .title(aiFlashcard.title() != null ? aiFlashcard.title().trim()
                            : "Flashcard - " + document.getTitle())
                    .description((aiFlashcard.description() != null ? aiFlashcard.description() : "")
                            + " (Flashcard từ file: " + document.getTitle() + ")")
                    .difficulty(aiFlashcard.difficulty() != null ? aiFlashcard.difficulty().trim() : "MEDIUM")
                    .timeLimitMinutes(aiFlashcard.timeLimitMinutes() != null ? aiFlashcard.timeLimitMinutes() : 10)
                    .passingScore(80)
                    .isRandomized(false)
                    .showAnswers(true)
                    .visibility("PRIVATE")
                    .source("FLASHCARD")
                    .build();
            Quiz savedFlashcard = quizRepository.save(flashcardQuiz);

            if (aiFlashcard.questions() != null) {
                int position = 1;
                for (AiQuizQuestions aiQuestion : aiFlashcard.questions()) {
                    String optionJson = objectMapper.writeValueAsString(aiQuestion.options());

                    QuizQuestion question = QuizQuestion.builder()
                            .quizId(savedFlashcard.getQuizId())
                            .questionType(aiQuestion.questionType() != null
                                    ? aiQuestion.questionType().trim().toUpperCase()
                                    : "SINGLE_CHOICE")
                            .questionText(aiQuestion.questionText() != null ? aiQuestion.questionText().trim()
                                    : "Câu hỏi bị trống")
                            .options(optionJson)
                            .correctAnswer(aiQuestion.correctAnswer() != null ? aiQuestion.correctAnswer().trim() : "")
                            .explanation(aiQuestion.explanation())
                            .points(aiQuestion.points() != null ? aiQuestion.points() : 10)
                            .position(position++)
                            .build();
                    quizQuestionRepository.save(question);
                }
            }

            log.info("[Bước 5/5] Tạo Flashcard thành công: {} thẻ (Quiz ID: {})",
                    aiFlashcard.questions() != null ? aiFlashcard.questions().size() : 0,
                    savedFlashcard.getQuizId());
        } catch (Exception e) {
            log.warn("[Bước 5/5] Tạo Flashcard thất bại (không ảnh hưởng trạng thái document): {}", e.getMessage());
            log.debug("[Bước 5/5] Trace lỗi:", e);
        }
    }

    /**
     * Loại bỏ markdown code block wrapper mà model đôi khi trả về.
     * Ví dụ: ```json\n{...}\n``` → {...}
     */
    private String cleanJsonResponse(String response) {
        if (response == null)
            return "{}";
        String cleaned = response.trim();
        // Loại bỏ ```json ... ``` hoặc ``` ... ```
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline > 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
            }
        }
        return cleaned;
    }

    /**
     * Cập nhật trạng thái FAILED khi xử lý gặp lỗi nghiêm trọng.
     */
    private void handleProcessingFailure(Long documentId, String errorMessage) {
        try {
            documentRepository.findById(documentId).ifPresent(doc -> {
                doc.setProcessingStatus(ProcessingStatus.FAILED.toString());
                doc.setErrorMessage(errorMessage != null
                        ? errorMessage.substring(0, Math.min(errorMessage.length(), 500))
                        : "Unknown error");
                documentRepository.save(doc);
            });
        } catch (Exception e) {
            log.error("Không thể cập nhật trạng thái FAILED cho document ID: {}", documentId, e);
        }
    }
}
