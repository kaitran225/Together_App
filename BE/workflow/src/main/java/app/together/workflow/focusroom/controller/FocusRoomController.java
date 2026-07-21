package app.together.workflow.focusroom.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.focusroom.dto.FocusRoomDtos.*;
import app.together.workflow.focusroom.service.FocusRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/focus-room/tasks")
@RequiredArgsConstructor
public class FocusRoomController {

    private final FocusRoomService focusRoomService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FocusRoomTaskResponse>>> getTasks() {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ResponseEntity.ok(ApiResponse.ok(focusRoomService.getTasksForUser(userSso)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FocusRoomTaskResponse>> createTask(@RequestBody CreateFocusRoomTaskRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ResponseEntity.ok(ApiResponse.ok(focusRoomService.createTask(userSso, request)));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<ApiResponse<FocusRoomTaskResponse>> updateTask(@PathVariable Long taskId, @RequestBody UpdateFocusRoomTaskRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ResponseEntity.ok(ApiResponse.ok(focusRoomService.updateTask(taskId, userSso, request)));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long taskId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        focusRoomService.deleteTask(taskId, userSso);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
