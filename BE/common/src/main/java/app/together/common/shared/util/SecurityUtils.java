package app.together.common.shared.util;

import app.together.common.auth.enums.SystemRole;
import app.together.common.auth.enums.UserTier;
import app.together.common.shared.constant.MessageConstants;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/** Current user / JWT from SecurityContext. */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /** Current authentication. */
    public static Optional<Authentication> getCurrentAuthentication() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication());
    }

    /** Current JWT principal. */
    public static Optional<Jwt> getCurrentJwt() {
        return getCurrentAuthentication()
                .filter(a -> a.getPrincipal() instanceof Jwt)
                .map(a -> (Jwt) a.getPrincipal());
    }

    /** Current user SSO (JWT subject). */
    public static Optional<String> getCurrentUserSso() {
        return getCurrentJwt().map(Jwt::getSubject);
    }

    /** User SSO or null. */
    public static String getCurrentUserSsoOrNull() {
        return getCurrentUserSso().orElse(null);
    }

    /** User SSO or throw. */
    public static String requireCurrentUserSso() {
        return getCurrentUserSso()
                .orElseThrow(() -> new IllegalStateException(MessageConstants.MESSAGE_USER_SSO_NOT_IN_CONTEXT));
    }

    /** JWT subject. */
    public static Optional<String> getSubject() {
        return getCurrentJwt().map(Jwt::getSubject);
    }

    /** Email from JWT. */
    public static Optional<String> getCurrentUserEmail() {
        return getCurrentJwt()
                .map(jwt -> jwt.getClaimAsString("email"));
    }

    /** Platform role from JWT claim {@code system_role}. */
    public static Optional<SystemRole> getCurrentSystemRole() {
        return getClaimAsString("system_role").flatMap(SecurityUtils::parseSystemRole);
    }

    /**
     * Billing / product tier: claim {@code user_tier}, else {@code plan_type},
     * parsed with {@link UserTier#parse}.
     */
    public static Optional<UserTier> getCurrentUserTier() {
        Optional<String> explicit = getClaimAsString("user_tier");
        if (explicit.isPresent()) {
            return Optional.of(UserTier.parse(explicit.get()));
        }
        return getClaimAsString("plan_type").map(UserTier::parse);
    }

    /** User ID from JWT. */
    public static Optional<Long> getCurrentUserId() {
        return getCurrentJwt()
                .flatMap(jwt -> {
                    Object uid = jwt.getClaim("user_id");
                    if (uid == null)
                        uid = jwt.getClaim("userId");
                    if (uid instanceof Number)
                        return Optional.of(((Number) uid).longValue());
                    if (uid instanceof String) {
                        try {
                            return Optional.of(Long.parseLong((String) uid));
                        } catch (NumberFormatException e) {
                            return Optional.empty();
                        }
                    }
                    return Optional.empty();
                });
    }

    /** Full name from JWT. */
    public static Optional<String> getCurrentUserFullName() {
        return getCurrentJwt()
                .map(jwt -> jwt.getClaimAsString("name"))
                .or(() -> getCurrentJwt().map(jwt -> jwt.getClaimAsString("full_name")));
    }

    /** All JWT claims map. */
    public static Map<String, Object> getCurrentUserClaims() {
        return getCurrentJwt()
                .map(Jwt::getClaims)
                .map(Map::copyOf)
                .orElse(Collections.emptyMap());
    }

    /** Single claim by name. */
    public static Optional<Object> getClaim(String name) {
        return getCurrentJwt().map(jwt -> jwt.getClaim(name));
    }

    /** Claim as string. */
    public static Optional<String> getClaimAsString(String name) {
        return getCurrentJwt().map(jwt -> jwt.getClaimAsString(name));
    }

    /** Has JWT / authenticated. */
    public static boolean isAuthenticated() {
        return getCurrentJwt().isPresent();
    }

    /**
     * Platform admin (JWT {@code system_role} ADMIN or legacy {@code is_admin}).
     */
    public static boolean isSystemAdmin() {
        return getCurrentSystemRole().map(r -> r == SystemRole.ADMIN).orElse(false)
                || Boolean.TRUE.equals(
                        getCurrentJwt().map(j -> j.getClaim("is_admin")).map(SecurityUtils::toBoolean).orElse(false));
    }

    private static Optional<SystemRole> parseSystemRole(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(SystemRole.valueOf(raw.trim()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private static boolean toBoolean(Object claim) {
        if (claim instanceof Boolean b) {
            return b;
        }
        if (claim instanceof String s) {
            return Boolean.parseBoolean(s);
        }
        return false;
    }

    /** Authority strings. */
    public static java.util.List<String> getAuthorities() {
        return getCurrentAuthentication()
                .map(Authentication::getAuthorities)
                .map(auths -> auths.stream().map(Object::toString).collect(Collectors.toList()))
                .orElse(Collections.emptyList());
    }

    /** Snapshot: userSso, email, userId, claims. */
    public static CurrentUserInfo getCurrentUserInfo() {
        Optional<Jwt> jwt = getCurrentJwt();
        if (jwt.isEmpty())
            return CurrentUserInfo.anonymous();
        Jwt j = jwt.get();

        return new CurrentUserInfo(
                j.getSubject(),
                j.getClaimAsString("email"),
                getCurrentUserId().orElse(null),
                getCurrentUserFullName().orElse(null),
                getCurrentUserClaims(),
                true);

    }

    public record CurrentUserInfo(
            String userSso,
            String email,
            Long userId,
            String fullName,
            Map<String, Object> claims,
            boolean authenticated) {
        public static CurrentUserInfo anonymous() {
            return new CurrentUserInfo(null, null, null, null, Collections.emptyMap(), false);
        }
    }
}
