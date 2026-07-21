package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.entity.Quiz;
import app.together.common.workflow.entity.QuizQuestion;
import app.together.workflow.personal.dto.ChatDtos;
import app.together.workflow.personal.service.PersonalQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/quizzes")
@RequiredArgsConstructor
public class PersonalQuizController {

    private final PersonalQuizService personalQuizService;

    @PostMapping("/generate")
    public ApiResponse<Quiz> generateQuizFromDocument(@RequestBody ChatDtos.GenerateQuizRequest request){
        String userSso = SecurityUtils.requireCurrentUserSso();
        Quiz quiz = personalQuizService.generateQuizFromDocument(userSso, request);
        return ApiResponse.ok(quiz);
    }

    @GetMapping("/{quizId}/questions")
    public ApiResponse<List<QuizQuestion>> getQuizQuestions(@PathVariable Long quizId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalQuizService.getQuizQuestions(userSso, quizId));
    }
}
