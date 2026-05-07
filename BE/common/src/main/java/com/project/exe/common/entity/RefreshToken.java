package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class RefreshToken extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    @EqualsAndHashCode.Include
    Long tokenId;

    @Column(name = "user_id", nullable = false)
    @EqualsAndHashCode.Include
    Long userId;

    @Column(name = "token_hash", nullable = false)
    String tokenHash;

    @Column(name = "device_info", columnDefinition = "TEXT")
    String deviceInfo;

    @Column(name = "expires_at", nullable = false)
    Instant expiresAt;

    @Column(name = "revoked")
    Boolean revoked = false;

    @Column(name = "revoked_at")
    Instant revokedAt;
}
