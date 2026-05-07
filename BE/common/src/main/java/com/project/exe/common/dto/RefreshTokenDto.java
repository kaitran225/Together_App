package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class RefreshTokenDto {
    Long tokenId;
    Long userId;
    String tokenHash;
    String deviceInfo;
    Instant expiresAt;
    Boolean revoked;
    Instant revokedAt;

}
