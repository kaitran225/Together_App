package app.together.auth.service;

import app.together.common.auth.entity.RefreshToken;
import app.together.common.auth.entity.User;
import app.together.common.auth.enums.SystemRole;
import app.together.common.auth.enums.UserTier;
import app.together.common.auth.repository.RefreshTokenRepository;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.constant.MessageConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${spring.jwt.expiration}")
    private long accessTokenExpirySeconds;

    @Value("${spring.jwt.refresh-token-expiration}")
    private long refreshTokenExpirySeconds;

    @Value("${auth.issuer-uri}")
    private String issuerUri;

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(accessTokenExpirySeconds);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuerUri)
                .issuedAt(now)
                .expiresAt(expiry)
                .subject(user.getUserSso())
                .id(UUID.randomUUID().toString())
                .claim("user_id", user.getUserId())
                .claim("plan_type", user.getPlanType())
                .claim("user_tier", UserTier.parse(user.getPlanType()).name())
                .claim("user_email", user.getEmail())
                .claim("system_role", user.getSystemRole() != null ? user.getSystemRole().name() : SystemRole.USER.name())
                .claim("status", user.getStatus())
                .claim("is_admin", user.getSystemRole() == SystemRole.ADMIN
                        || Boolean.TRUE.equals(user.getIsAdmin()))
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    @Transactional
    public String generateRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .userId(user.getUserId())
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plusSeconds(refreshTokenExpirySeconds))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional(readOnly = true)
    public Optional<User> validateRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        return refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(rt -> Boolean.FALSE.equals(rt.getRevoked()))
                .filter(rt -> rt.getExpiresAt().isAfter(Instant.now()))
                .map(RefreshToken::getUserId)
                .flatMap(userRepository::findById);
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(rt -> {
            rt.setRevoked(true);
            rt.setRevokedAt(Instant.now());
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional
    public void revokeAllUserRefreshTokens(Long userId) {
        refreshTokenRepository.findByUserId(userId).forEach(rt -> {
            rt.setRevoked(true);
            rt.setRevokedAt(Instant.now());
            refreshTokenRepository.save(rt);
        });
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(MessageConstants.MESSAGE_TOKEN_HASH_FAILED, e);
        }
    }
}
