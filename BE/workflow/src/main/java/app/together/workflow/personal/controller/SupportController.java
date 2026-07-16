package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.SupportDtos.SendSupportMessageRequest;
import app.together.workflow.personal.dto.SupportDtos.SupportMessageResponse;
import app.together.workflow.personal.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    @GetMapping("/messages")
    public ApiResponse<List<SupportMessageResponse>> getMyMessages() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(supportService.getMyMessages(currentUserSso));
    }

    @PostMapping("/messages")
    public ApiResponse<SupportMessageResponse> sendMessage(@RequestBody SendSupportMessageRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(supportService.sendMessageAsUser(currentUserSso, request.message()));
    }
}
