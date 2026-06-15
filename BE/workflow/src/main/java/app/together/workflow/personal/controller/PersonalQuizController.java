package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.entity.Quiz;
import app.together.workflow.personal.dto.ChatDtos;
import app.together.workflow.personal.service.PersonalQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
