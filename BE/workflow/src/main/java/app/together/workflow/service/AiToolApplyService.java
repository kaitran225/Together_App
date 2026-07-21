package app.together.workflow.service;

import app.together.common.ai.api.AiApplyRequest;
import app.together.common.ai.api.AiApplyResponse;
import app.together.common.workflow.entity.Flashcard;
import app.together.common.workflow.entity.Mindmap;
import app.together.common.workflow.entity.Quiz;
import app.together.common.workflow.entity.QuizQuestion;
import app.together.common.workflow.entity.Schedule;
import app.together.common.workflow.entity.Summary;
import app.together.common.workflow.repository.FlashcardRepository;
import app.together.common.workflow.repository.MindmapRepository;
import app.together.common.workflow.repository.QuizQuestionRepository;
import app.together.common.workflow.repository.QuizRepository;
import app.together.common.workflow.repository.ScheduleRepository;
import app.together.common.workflow.repository.SummaryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiToolApplyService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final FlashcardRepository flashcardRepository;
    private final MindmapRepository mindmapRepository;
    private final ScheduleRepository scheduleRepository;
    private final SummaryRepository summaryRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiApplyResponse apply(AiApplyRequest request) {
        String tool = request.tool();
        ObjectNode ids = objectMapper.createObjectNode();

        return switch (tool) {
            case "CREATE_QUIZ" -> applyQuiz(request, ids, false);
            case "CREATE_FLASHCARD" -> applyQuiz(request, ids, true);
            case "CREATE_MINDMAP" -> applyMindmap(request, ids);
            case "CREATE_EVENT" -> applySchedule(request, ids);
            case "MESSAGE_SUMMARIZE" -> applySummary(request, ids);
            case "SEARCH" -> new AiApplyResponse(
                    false, "SEARCH", ids, "SEARCH results are not persisted; use payload in gateway only");
            default -> new AiApplyResponse(false, request.artifactType(), ids, "Unsupported tool: " + tool);
        };
    }

    private AiApplyResponse applyQuiz(AiApplyRequest request, ObjectNode ids, boolean withFlashcards) {
        JsonNode payload = request.payload();
        JsonNode quizNode = payload.get("quiz");
        if (quizNode == null || quizNode.isMissingNode()) {
            return new AiApplyResponse(false, "QUIZ", ids, "Missing quiz payload");
        }

        Quiz quiz = Quiz.builder()
                .userSso(text(quizNode, "userSso", request.userSso()))
                .documentId(longOrNull(quizNode, "documentId", request.documentId()))
                .title(text(quizNode, "title", "AI Quiz"))
                .description(text(quizNode, "description", null))
                .difficulty(text(quizNode, "difficulty", "medium"))
                .timeLimitMinutes(intOrNull(quizNode, "timeLimitMinutes"))
                .passingScore(intOrNull(quizNode, "passingScore"))
                .isRandomized(bool(quizNode, "isRandomized", false))
                .showAnswers(bool(quizNode, "showAnswers", true))
                .build();
        quiz = quizRepository.save(quiz);
        ids.put("quizId", quiz.getQuizId());

        List<Long> questionIds = new ArrayList<>();
        JsonNode questions = payload.get("questions");
        JsonNode flashDefaults = payload.get("flashcardDefaults");
        if (questions != null && questions.isArray()) {
            int i = 0;
            for (JsonNode q : questions) {
                QuizQuestion question = QuizQuestion.builder()
                        .quizId(quiz.getQuizId())
                        .questionType(text(q, "questionType", "multiple_choice"))
                        .questionText(text(q, "questionText", ""))
                        .options(text(q, "options", "[]"))
                        .correctAnswer(text(q, "correctAnswer", ""))
                        .explanation(text(q, "explanation", null))
                        .points(intOrNull(q, "points"))
                        .position(intOrNull(q, "position"))
                        .build();
                question = quizQuestionRepository.save(question);
                questionIds.add(question.getQuestionId());

                if (withFlashcards) {
                    JsonNode fc = flashDefaults != null && flashDefaults.size() > i
                            ? flashDefaults.get(i)
                            : null;
                    Flashcard flashcard = Flashcard.builder()
                            .quizId(quiz.getQuizId())
                            .quizQuestionId(question.getQuestionId())
                            .easeFactor(decimal(fc, "easeFactor", "2.5"))
                            .interval(intOrNull(fc, "interval") != null ? intOrNull(fc, "interval") : 1)
                            .repetitions(intOrNull(fc, "repetitions") != null ? intOrNull(fc, "repetitions") : 0)
                            .nextReviewDate(parseDate(fc, "nextReviewDate"))
                            .build();
                    flashcardRepository.save(flashcard);
                }
                i++;
            }
        }
        ids.putPOJO("questionIds", questionIds);
        String artifact = withFlashcards ? "FLASHCARD_DECK" : "QUIZ";
        return new AiApplyResponse(true, artifact, ids, "Quiz artifacts persisted");
    }

    private AiApplyResponse applyMindmap(AiApplyRequest request, ObjectNode ids) {
        JsonNode mind = request.payload().get("mindmap");
        if (mind == null) {
            return new AiApplyResponse(false, "MINDMAP", ids, "Missing mindmap payload");
        }
        Mindmap entity = Mindmap.builder()
                .userSso(text(mind, "userSso", request.userSso()))
                .documentId(longOrNull(mind, "documentId", request.documentId()))
                .title(text(mind, "title", "AI Mindmap"))
                .content(text(mind, "content", "{}"))
                .thumbnailUrl(text(mind, "thumbnailUrl", null))
                .build();
        entity = mindmapRepository.save(entity);
        ids.put("mindmapId", entity.getMindmapId());
        return new AiApplyResponse(true, "MINDMAP", ids, "Mindmap persisted");
    }

    private AiApplyResponse applySchedule(AiApplyRequest request, ObjectNode ids) {
        JsonNode sched = request.payload().get("schedule");
        if (sched == null) {
            return new AiApplyResponse(false, "SCHEDULE", ids, "Missing schedule payload");
        }
        Schedule entity = Schedule.builder()
                .userSso(text(sched, "userSso", request.userSso()))
                .title(text(sched, "title", "Study event"))
                .description(text(sched, "description", null))
                .location(text(sched, "location", null))
                .startTime(parseInstant(sched, "startTime"))
                .endTime(parseInstant(sched, "endTime"))
                .isAllDay(bool(sched, "isAllDay", false))
                .timezone(text(sched, "timezone", "UTC"))
                .status(text(sched, "status", "scheduled"))
                .source(text(sched, "source", "ai"))
                .build();
        entity = scheduleRepository.save(entity);
        ids.put("scheduleId", entity.getScheduleId());
        return new AiApplyResponse(true, "SCHEDULE", ids, "Schedule persisted");
    }

    private AiApplyResponse applySummary(AiApplyRequest request, ObjectNode ids) {
        JsonNode sum = request.payload().get("summary");
        Long docId = request.documentId();
        if (sum != null && !sum.path("documentId").isMissingNode()) {
            docId = sum.get("documentId").asLong();
        }
        if (docId == null) {
            return new AiApplyResponse(false, "SUMMARY", ids, "documentId is required for summary");
        }
        Summary entity = Summary.builder()
                .documentId(docId)
                .summaryType(text(sum, "summaryType", "brief"))
                .content(text(sum, "content", ""))
                .modelUsed(text(sum, "modelUsed", null))
                .generatedAt(Instant.now())
                .build();
        entity = summaryRepository.save(entity);
        ids.put("summaryId", entity.getSummaryId());
        return new AiApplyResponse(true, "SUMMARY", ids, "Summary persisted");
    }

    private static String text(JsonNode node, String field, String defaultVal) {
        if (node == null || node.path(field).isMissingNode() || node.path(field).isNull()) {
            return defaultVal;
        }
        return node.get(field).asText();
    }

    private static Long longOrNull(JsonNode node, String field, Long fallback) {
        if (node != null && !node.path(field).isMissingNode() && !node.path(field).isNull()) {
            return node.get(field).asLong();
        }
        return fallback;
    }

    private static Integer intOrNull(JsonNode node, String field) {
        if (node == null || node.path(field).isMissingNode() || node.path(field).isNull()) {
            return null;
        }
        return node.get(field).asInt();
    }

    private static boolean bool(JsonNode node, String field, boolean defaultVal) {
        if (node == null || node.path(field).isMissingNode()) {
            return defaultVal;
        }
        return node.get(field).asBoolean(defaultVal);
    }

    private static BigDecimal decimal(JsonNode node, String field, String defaultVal) {
        if (node == null || node.path(field).isMissingNode()) {
            return new BigDecimal(defaultVal);
        }
        return BigDecimal.valueOf(node.get(field).asDouble());
    }

    private static Instant parseInstant(JsonNode node, String field) {
        String raw = text(node, field, null);
        if (raw == null) {
            return Instant.now();
        }
        try {
            return Instant.parse(raw);
        } catch (DateTimeParseException e) {
            return Instant.now();
        }
    }

    private static LocalDate parseDate(JsonNode node, String field) {
        if (node == null || node.path(field).isMissingNode()) {
            return LocalDate.now();
        }
        try {
            return LocalDate.parse(node.get(field).asText());
        } catch (Exception e) {
            return LocalDate.now();
        }
    }
}
