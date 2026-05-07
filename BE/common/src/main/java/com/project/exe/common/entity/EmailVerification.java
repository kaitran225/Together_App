package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "email_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class EmailVerification extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "verification_id")
    @EqualsAndHashCode.Include
    Long verificationId;

    @Column(name = "user_id")
    @EqualsAndHashCode.Include
    Long userId;

    @Column(nullable = false)
    String email;

    @Column(name = "verification_code", nullable = false)
    String verificationCode;

    @Column(name = "is_edu_email")
    Boolean isEduEmail = false;

    @Column(name = "verified_at")
    Instant verifiedAt;

    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;

    @Column(name = "attempts")
    Integer attempts;
}
