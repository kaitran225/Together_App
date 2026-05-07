package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserDto {
    Long userId;
    @NotBlank(message = "userSso required")
    @Size(max = 255)
    String userSso;
    @NotBlank(message = "email required")
    @Email
    @Size(max = 255)
    String email;
    @Size(max = 255)
    String fullName;
    @Size(max = 2048)
    String avatarUrl;
    String planType;
    Instant planExpiresAt;
    Integer exp;
    Integer level;
    Integer streak;
    Integer longestStreak;
    LocalDate lastActiveDate;
    String status;
    Boolean emailVerified;
    Instant createdAt;
    Instant updatedAt;
    Boolean isAdmin;
}
