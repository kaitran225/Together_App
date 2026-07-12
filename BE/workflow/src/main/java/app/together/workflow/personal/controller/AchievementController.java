package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.workflow.personal.dto.UserAchievementDetailResponse;
import app.together.workflow.personal.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/public/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping("/{userSso}")
    public ApiResponse<List<UserAchievementDetailResponse>> getUserAchievements(@PathVariable String userSso) {
        return ApiResponse.ok(achievementService.getUserAchievements(userSso));
    }
}
