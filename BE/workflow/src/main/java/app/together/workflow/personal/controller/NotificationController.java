package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.workflow.dto.NotificationDto;
import app.together.workflow.personal.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationDto>> getMyNotifications() {
        return ApiResponse.ok(notificationService.getMyNotifications());
    }

    @org.springframework.web.bind.annotation.PatchMapping("/{notificationId}/read")
    public ApiResponse<NotificationDto> markAsRead(@org.springframework.web.bind.annotation.PathVariable Long notificationId) {
        return ApiResponse.ok(notificationService.markAsRead(notificationId));
    }

    @org.springframework.web.bind.annotation.PostMapping("/read-all")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ApiResponse.ok(null);
    }
}
