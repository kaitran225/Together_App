package app.together.common.auth.dto;

import lombok.Builder;

@Builder
public record UpdateUserRequest(
        String fullName,
        String avatarUrl,
        java.util.List<String> skills,
        java.util.List<String> learningGoals
) {
}
