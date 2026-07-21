package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.ChatDtos.*;
import app.together.workflow.personal.service.PersonalChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/chat")
@RequiredArgsConstructor
public class PersonalChatController {

    private final PersonalChatService personalChatService;

    @PostMapping("/conversations")
    public ApiResponse<ChatConversationResponse> createConversation(@RequestBody CreateConversationRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalChatService.createConversation(currentUserSso, request));
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ChatConversationResponse>> getConversations() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalChatService.getConversations(currentUserSso));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @RequestBody SendMessageRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalChatService.sendMessage(conversationId, currentUserSso, request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<List<ChatMessageResponse>> getMessages(@PathVariable Long conversationId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(personalChatService.getMessages(conversationId, currentUserSso));
    }
}
