package app.together.workflow.team.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.team.dto.TaskDtos.*;
import app.together.workflow.team.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/projects/{projectId}/tasks")
    public ApiResponse<TaskDetailsResponse> createTask(
            @PathVariable Long projectId,
            @RequestBody CreateTaskRequest request
            ){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(taskService.createTask(projectId, currentUserSso, request));
    }

    @GetMapping("/tasks/{taskId}")
    public ApiResponse<TaskDetailsResponse> getTask(@PathVariable Long taskId){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(taskService.getTaskDetails(taskId, currentUserSso));
    }

    @PostMapping("/tasks/{taskId}/assign")
    public ApiResponse<TaskDetailsResponse> assignTask(
            @PathVariable Long taskId,
            @RequestBody AssignTaskRequest request){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(taskService.assignTask(taskId, currentUserSso, request));
    }

    @PostMapping("/tasks/{taskId}/dependencies")
    public ApiResponse<TaskDetailsResponse> addDependency(
            @PathVariable Long taskId,
            @RequestBody AddTaskDependencyRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(taskService.addDependency(taskId, currentUserSso, request));
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ApiResponse<TaskDetailsResponse> addComment(
            @PathVariable Long taskId,
            @RequestBody AddTaskCommentRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(taskService.addComment(taskId, currentUserSso, request));
    }

    @PostMapping("/tasks/{taskId}/attachments")
    public ApiResponse<TaskDetailsResponse> addAttachment(
            @PathVariable Long taskId,
            @RequestBody AddAttachmentRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(taskService.addAttachment(taskId, currentUserSso, request));
    }
}
