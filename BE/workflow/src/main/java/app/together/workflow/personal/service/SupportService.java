package app.together.workflow.personal.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.SupportMessage;
import app.together.common.workflow.repository.SupportMessageRepository;
import app.together.workflow.personal.dto.SupportDtos.SupportConversationResponse;
import app.together.workflow.personal.dto.SupportDtos.SupportMessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportService {

    private static final String SENDER_USER = "USER";
    private static final String SENDER_ADMIN = "ADMIN";

    private final SupportMessageRepository supportMessageRepository;
    private final UserRepository userRepository;
    private final PermissionCheckService permissionCheckService;

    public SupportMessageResponse sendMessageAsUser(String userSso, String message) {
        return toResponse(saveMessage(userSso, SENDER_USER, message));
    }

    public SupportMessageResponse sendMessageAsAdmin(String targetUserSso, String message, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);
        userRepository.findByUserSso(targetUserSso)
                .orElseThrow(() -> new BadRequestException("User not found: " + targetUserSso));
        return toResponse(saveMessage(targetUserSso, SENDER_ADMIN, message));
    }

    @Transactional(readOnly = true)
    public List<SupportMessageResponse> getMyMessages(String userSso) {
        return supportMessageRepository.findByUserSsoOrderByCreatedAtAsc(userSso).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupportMessageResponse> getConversationForAdmin(String userSso) {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        return supportMessageRepository.findByUserSsoOrderByCreatedAtAsc(userSso).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupportConversationResponse> listConversationsForAdmin() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);

        List<SupportMessage> allMessages = supportMessageRepository.findAll();
        return allMessages.stream()
                .collect(java.util.stream.Collectors.groupingBy(SupportMessage::getUserSso))
                .entrySet().stream()
                .map(entry -> {
                    String userSso = entry.getKey();
                    SupportMessage last = entry.getValue().stream()
                            .max(Comparator.comparing(SupportMessage::getCreatedAt))
                            .orElseThrow();
                    User user = userRepository.findByUserSso(userSso).orElse(null);
                    return new SupportConversationResponse(
                            userSso,
                            user != null && user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : userSso,
                            user != null ? user.getPlanType() : null,
                            user != null ? user.getStatus() : null,
                            last.getMessage(),
                            last.getCreatedAt());
                })
                .sorted(Comparator.comparing(SupportConversationResponse::lastMessageAt).reversed())
                .toList();
    }

    private SupportMessage saveMessage(String userSso, String sender, String message) {
        if (message == null || message.isBlank()) {
            throw new BadRequestException("Message cannot be empty.");
        }
        SupportMessage entity = SupportMessage.builder()
                .userSso(userSso)
                .sender(sender)
                .message(message.trim())
                .build();
        entity.setCreatedBy(userSso);
        entity.setUpdatedBy(userSso);
        return supportMessageRepository.save(entity);
    }

    private SupportMessageResponse toResponse(SupportMessage entity) {
        return new SupportMessageResponse(
                entity.getMessageId(),
                entity.getUserSso(),
                entity.getSender(),
                entity.getMessage(),
                entity.getCreatedAt());
    }
}
