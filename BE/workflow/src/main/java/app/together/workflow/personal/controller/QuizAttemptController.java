package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.QuizAttemptDtos.*;
import app.together.workflow.personal.service.QuizAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/quiz-attempts")
@RequiredArgsConstructor
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    /**
     * Bắt đầu làm bài quiz (tạo attempt mới)
     */
    @PostMapping("/start")
    public ApiResponse<QuizAttemptResponse> startQuiz(@RequestBody StartQuizAttemptRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(quizAttemptService.startQuizAttempt(userSso, request));
    }

    /**
     * Nộp bài quiz (chấm điểm tự động)
     */
    @PostMapping("/{attemptId}/submit")
    public ApiResponse<QuizResultResponse> submitQuiz(@PathVariable Long attemptId,
            @RequestBody SubmitQuizAttemptRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(quizAttemptService.submitQuizAttempt(attemptId, userSso, request));
    }

    /**
     * Xem lịch sử các lần làm quiz
     */
    @GetMapping("/history/{quizId}")
    public ApiResponse<List<QuizAttemptHistoryResponse>> getAttemptHistory(@PathVariable Long quizId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(quizAttemptService.getAttemptHistory(quizId, userSso));
    }

    /**
     * Xem chi tiết kết quả một lần làm quiz
     */
    @GetMapping("/{attemptId}")
    public ApiResponse<QuizAttemptResponse> getAttemptDetail(@PathVariable Long attemptId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(quizAttemptService.getAttemptDetail(attemptId, userSso));
    }
}
