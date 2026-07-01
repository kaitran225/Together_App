package app.together.workflow.team.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.team.dto.ScrumBoardDtos.CreateColumnRequest;
import app.together.workflow.team.dto.ScrumBoardDtos.MoveTaskRequest;
import app.together.workflow.team.dto.ScrumBoardDtos.ScrumBoardResponse;
import app.together.workflow.team.service.ScrumBoardService;
import org.springframework.web.bind.annotation.RequestBody;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/workflow/projects/{projectId}/board")
@RequiredArgsConstructor
public class ScrumBoardController {

    private final ScrumBoardService scrumBoardService;

    @GetMapping
    public ApiResponse<ScrumBoardResponse> getBoard(@PathVariable Long projectId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(scrumBoardService.getBoardStage(projectId, currentUserSso));
    }

    @PostMapping("/tasks/{taskId}/move")
    public ApiResponse<ScrumBoardResponse> moveTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody MoveTaskRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(scrumBoardService.moveTask(projectId, taskId, currentUserSso, request));
    }

    @PostMapping("/columns")
    public ApiResponse<ScrumBoardResponse> createColumn(
            @PathVariable Long projectId,
            @RequestBody CreateColumnRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(scrumBoardService.createCustomColumn(projectId, currentUserSso, request));
    }
}
