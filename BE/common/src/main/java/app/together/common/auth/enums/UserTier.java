package app.together.common.auth.enums;

/**
 * Product / billing tier for entitlements and {@link app.together.common.shared.security.PermissionRule}.
 * Persisted in {@code users.plan_type} and JWT claims {@code user_tier} / {@code plan_type}.
 */
public enum UserTier {

    FREE,
    PRO,
    PLUS,
    TEAM,
    COMBO,
    ENTERPRISE;

    /**
     * Resolves tier from JWT or DB string. Blank → {@link #FREE}.
     * Accepts this enum's names and legacy {@code PERSONAL}/{@code TEAMS}/{@code COMBO}.
     */
    public static UserTier parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return FREE;
        }
        String s = raw.trim();
        try {
            return UserTier.valueOf(s);
        } catch (IllegalArgumentException ignored) {
            return switch (s) {
                case "PERSONAL" -> PLUS;
                case "TEAMS" -> TEAM;
                case "COMBO" -> COMBO;
                default -> FREE;
            };
        }
    }
}
