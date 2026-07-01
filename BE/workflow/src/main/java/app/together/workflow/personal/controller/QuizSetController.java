package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.QuizSetDtos.ShareQuizSetRequest;
import app.together.workflow.personal.dto.QuizSetDtos.QuizSetResponse;
import app.together.workflow.personal.service.PersonalQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/quiz-sets")
@RequiredArgsConstructor
public class QuizSetController {

    private final PersonalQuizService personalQuizService;

    @GetMapping
    public ApiResponse<List<QuizSetResponse>> getAvailableQuizSets(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String difficulty) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalQuizService.getAvailableQuizSets(currentUserSso, q, difficulty));
    }

    @PatchMapping("/{quizId}/sharing")
    public ApiResponse<QuizSetResponse> updateQuizSetSharing(
            @PathVariable Long quizId,
            @RequestBody ShareQuizSetRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalQuizService.updateQuizSetSharing(
                currentUserSso,
                quizId,
                request != null ? request.visibility() : null));
    }
}
