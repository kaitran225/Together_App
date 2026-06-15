package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.entity.Flashcard;
import app.together.workflow.personal.service.SpacedRepetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Service
@RequiredArgsConstructor
@RequestMapping("api/v1/workflow/personal/flashcards")
public class FlashcardController {

    private final SpacedRepetitionService spacedRepetitionService;

    public record ReviewRequest(
            Long quizId,
            Long quizQuestionId,
            Integer quality // Điểm từ 0 đến 5 của thuật toán SM-2
    ) {}

    @PostMapping("/review")
    public ApiResponse<Flashcard> reviewFlashcard(@RequestBody ReviewRequest request){
        SecurityUtils.getCurrentUserSso();

        Flashcard updated = spacedRepetitionService.reviewFlashcard(
                request.quizId(),
                request.quizQuestionId(),
                request.quality()
        );
        return ApiResponse.ok(updated);
    }
}
