package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class User extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    @EqualsAndHashCode.Include
    Long userId;

    @Column(name = "user_sso", unique = true, nullable = false)
    String userSso;

    @Column(nullable = false, unique = true)
    String email;

    @Column(name = "password_hash")
    String passwordHash;

    @Column(name = "full_name")
    String fullName;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    String avatarUrl;

    @Column(name = "plan_type")
    String planType;

    @Column(name = "plan_expires_at")
    Instant planExpiresAt;

    @Column(name = "exp")
    Integer exp;

    @Column(name = "level")
    Integer level;

    @Column(name = "streak")
    Integer streak;

    @Column(name = "longest_streak")
    Integer longestStreak;

    @Column(name = "last_active_date")
    LocalDate lastActiveDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;

    @Column(name = "status")
    String status;

    @Column(name = "email_verified", nullable = false)
    Boolean emailVerified = false;

    Boolean isAdmin = false;
}
