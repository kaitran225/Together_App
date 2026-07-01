package app.together.common.auth.dto;

import app.together.common.auth.enums.SystemRole;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long userId,
        @NotBlank(message = "userSso required")
        @Size(max = 255)
        String userSso,
        @NotBlank(message = "email required")
        @Email
        @Size(max = 255)
        String email,
        @Size(max = 255)
        String fullName,
        @Size(max = 2048)
        String avatarUrl,
        String planType,
        Instant planExpiresAt,
        Integer exp,
        Integer level,
        Integer streak,
        Integer longestStreak,
        LocalDate lastActiveDate,
        String status,
        Boolean emailVerified,
        SystemRole systemRole,
        Boolean isAdmin,
        java.util.List<String> skills,
        java.util.List<String> learningGoals
) {
}
