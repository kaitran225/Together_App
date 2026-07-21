package app.together.workflow.team.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.team.service.TaskSubmissionService;
import app.together.workflow.team.dto.TaskSubmissionDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/workflow")
@RequiredArgsConstructor
public class TaskSubmissionController {

    private final TaskSubmissionService taskSubmissionService;

    @PostMapping("/tasks/{taskId}/submissions")
    public ApiResponse<TaskSubmissionResponse> submitTask(
            @PathVariable Long taskId,
            @RequestBody SubmitTaskRequest request
    ){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(taskSubmissionService.submitTask(taskId, currentUserSso, request));
    }

    @GetMapping("/tasks/{taskId}/submissions")
    public ApiResponse<List<TaskSubmissionResponse>> getSubmissions(@PathVariable Long taskId){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(taskSubmissionService.getSubmissionsForTask(taskId, currentUserSso));
    }

    @PostMapping("/submissions/{submissionId}/evaluate")
    public ApiResponse<TaskSubmissionResponse> evaluateTask(
            @PathVariable Long submissionId,
            @RequestBody EvaluateTaskRequest request
    ){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(taskSubmissionService.evaluateSubmission(submissionId, currentUserSso, request));
    }
}
