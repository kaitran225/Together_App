package com.project.exe.common.fixture;

import com.project.exe.common.dto.UserDto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Test fixtures for UserDto. Use in BE tests and as reference for FE fake data.
 */
public final class UserDtoTestFixtures {

    private UserDtoTestFixtures() {}

    /** Minimal valid user (required fields only). */
    public static UserDto minimal(String userSso, String email) {
        return UserDto.builder()
                .userSso(userSso)
                .email(email)
                .build();
    }

    /** Full "Alice" fixture. */
    public static UserDto alice() {
        return UserDto.builder()
                .userId(1L)
                .userSso("user-001")
                .email("alice@example.com")
                .fullName("Alice Demo")
                .avatarUrl(null)
                .planType("free")
                .planExpiresAt(null)
                .exp(120)
                .level(2)
                .streak(5)
                .longestStreak(12)
                .lastActiveDate(LocalDate.of(2025, 3, 7))
                .status("ACTIVE")
                .emailVerified(true)
                .createdAt(Instant.parse("2025-01-15T10:00:00Z"))
                .updatedAt(Instant.parse("2025-03-07T08:00:00Z"))
                .build();
    }

    /** Full "Bob" fixture (premium). */
    public static UserDto bob() {
        return UserDto.builder()
                .userId(2L)
                .userSso("user-002")
                .email("bob@example.com")
                .fullName("Bob Tester")
                .avatarUrl(null)
                .planType("premium")
                .planExpiresAt(Instant.parse("2025-12-31T23:59:59Z"))
                .exp(450)
                .level(4)
                .streak(0)
                .longestStreak(7)
                .lastActiveDate(LocalDate.of(2025, 3, 6))
                .status("ACTIVE")
                .emailVerified(true)
                .createdAt(Instant.parse("2025-02-01T12:00:00Z"))
                .updatedAt(Instant.parse("2025-03-06T14:00:00Z"))
                .build();
    }
}
