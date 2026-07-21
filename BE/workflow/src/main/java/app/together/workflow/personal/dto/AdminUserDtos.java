package app.together.workflow.personal.dto;

import java.time.Instant;

public final class AdminUserDtos {

    private AdminUserDtos() {
    }

    public record AdminUserResponse(
            Long userId,
            String userSso,
            String email,
            String fullName,
            String avatarUrl,
            String planType,
            String status,
            String systemRole,
            Instant createdAt) {
    }

    public record CreateUserRequest(
            String email,
            String password,
            String fullName,
            String systemRole) {
    }

    public record UpdateUserRoleRequest(String systemRole) {
    }

    public record UpdateUserProfileRequest(
            String fullName,
            String email,
            String avatarUrl) {
    }

    public record UpdateUserPlanRequest(
            String planType,
            Integer durationDays,
            Instant planExpiresAt) {
    }
}
