package app.together.common.shared.security;

import app.together.common.auth.enums.RoomRole;
import app.together.common.auth.enums.SystemRole;
import app.together.common.auth.enums.TeamRole;
import app.together.common.auth.enums.UserTier;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

/**
 * Permission → conjunctive rules ({@link PermissionRule}). Access is granted
 * when <strong>every</strong>
 * rule in the row {@link PermissionRule#matches matches}. Platform admin
 * bypasses the matrix.
 * <p>
 * <strong>Maintaining:</strong> edit role bundles in {@link Bundles}, reusable
 * shapes in {@link Patterns},
 * and the exhaustive {@link #rulesFor(Permission)} switch — new
 * {@link Permission} constants require a
 * {@code case} or the project will not compile.
 */
public final class PermissionMatrix {

        /**
         * Shared {@link EnumSet}s — change once, affects every pattern that uses them.
         */
        private static final class Bundles {
                static final EnumSet<SystemRole> LOGGED_IN = EnumSet.of(SystemRole.USER, SystemRole.ADMIN);
                private Bundles() {
                }
        }

        /** Named rule templates — add methods here as product rules grow. */
        private static final class Patterns {

                static PermissionRule anyUser() {
                        return PermissionRule.systemOnly(SystemRole.USER, SystemRole.ADMIN);
                }

                // --- SOCIAL PATTERNS ---
                static PermissionRule roomParticipant() {
                        return PermissionRule.roomRole(Bundles.LOGGED_IN,
                                        EnumSet.of(RoomRole.PARTICIPANT, RoomRole.HOST));
                }

                static PermissionRule roomHost() {
                        return PermissionRule.roomRole(Bundles.LOGGED_IN, EnumSet.of(RoomRole.HOST));
                }

                // --- TEAM PATTERNS ---
                static PermissionRule teamMember() {
                        return PermissionRule.teamRole(Bundles.LOGGED_IN, EnumSet.of(TeamRole.MEMBER, TeamRole.OWNER));
                }

                static PermissionRule teamOwner() {
                        return PermissionRule.teamRole(Bundles.LOGGED_IN, EnumSet.of(TeamRole.OWNER));
                }

                static PermissionRule adminOnly() {
                        return PermissionRule.systemOnly(
                                        SystemRole.ADMIN);
                }
        }

        private static final Map<Permission, List<PermissionRule>> RULES = new EnumMap<>(Permission.class);

        static {
                for (Permission p : Permission.values()) {
                        RULES.put(p, rulesFor(p));
                }
        }

        private PermissionMatrix() {
        }

        /**
         * Single source of truth for each permission row. Add conjuncts with
         * {@code PermissionRule.allOf(first, second, ...)} when a permission needs role
         * <em>and</em> tier checks.
         */
        private static List<PermissionRule> rulesFor(Permission permission) {

                return switch (permission) {
                        // AI & PERSONAL
                        case
                                        USER_SELF_READ,
                                        USER_SELF_WRITE,
                                        ROOM_CREATE,
                                        ROOM_JOIN,
                                        TEAM_CREATE,
                                        PERSONAL_SPACE_READ,
                                        PERSONAL_SPACE_WRITE,
                                        AI_CHAT_USE,
                                        AI_GENERATE_FLASHCARD,
                                        AI_GENERATE_MINDMAP,
                                        AI_GENERATE_QUIZ ->
                                PermissionRule.allOf(Patterns.anyUser());

                        // SOCIAL & MEETING (LEARNING ROOM)
                        case
                                        ROOM_CHAT,
                                        ROOM_SHARE_CAMERA,
                                        ROOM_SHARE_MIC,
                                        ROOM_SHARE_SCREEN ->
                                PermissionRule.allOf(Patterns.roomParticipant());

                        case
                                        ROOM_MODERATE,
                                        ROOM_KICK_MEMBER,
                                        ROOM_DELETE ->
                                PermissionRule.allOf(Patterns.roomHost());

                        // TEAMS
                        case
                                        TEAM_MEETING_JOIN,
                                        TEAM_REPORT_VIEW,
                                        TASK_CREATE,
                                        TASK_UPDATE,
                                        TEAM_MEETING_CREATE,
                                        WORKFLOW_READ ->
                                PermissionRule.allOf(Patterns.teamMember());

                        case
                                        TEAM_EDIT,
                                        TEAM_INVITE_MEMBER,
                                        TEAM_REMOVE_MEMBER,
                                        TEAM_DELETE,
                                        TASK_ASSIGN,
                                        TASK_DELETE,
                                        TASK_EVALUATE,
                                        WORKFLOW_WRITE ->
                                PermissionRule.allOf(Patterns.teamOwner());

                        // SYSTEM PLATFORM
                        case ORG_ADMIN_ACTIONS -> PermissionRule.allOf(Patterns.adminOnly());
                        case PLATFORM_AUDIT_READ,
                                        PLATFORM_CONFIG_WRITE ->
                                PermissionRule.allOf(Patterns.adminOnly());

                };
        }

        public static List<PermissionRule> rules(Permission permission) {
                return RULES.get(permission);
        }

        /**
         * For tests or feature flags: replace one row. Not synchronized.
         */
        public static void replaceRow(Permission permission, List<PermissionRule> conjuncts) {
                if (conjuncts == null || conjuncts.isEmpty()) {
                        throw new IllegalArgumentException("conjuncts must not be null or empty");
                }
                RULES.put(permission, List.copyOf(conjuncts));
        }

        /** Restore the built-in row from {@link #rulesFor(Permission)}. */
        public static void resetRow(Permission permission) {
                RULES.put(permission, rulesFor(permission));
        }

        /**
         * @param platformAdmin true when JWT marks user as platform admin
         *                      ({@code is_admin} or {@link SystemRole#ADMIN})
         */
        public static boolean isGranted(
                        Permission permission,
                        SystemRole systemRole,
                        // BusinessRole businessRole,
                        RoomRole roomRole,
                        TeamRole teamRole,
                        UserTier userTier,
                        boolean platformAdmin) {

                if (platformAdmin || systemRole == SystemRole.ADMIN) {
                        return true;
                }

                List<PermissionRule> conjuncts = RULES.get(permission);
                if (conjuncts == null || conjuncts.isEmpty()) {
                        return false;
                }

                UserTier tier = userTier != null ? userTier : UserTier.FREE;
                return conjuncts.stream().allMatch(r -> r.matches(systemRole, roomRole, teamRole, tier));
        }

        /** Unmodifiable copy for debugging or admin diagnostics. */
        public static Map<Permission, List<PermissionRule>> snapshot() {
                return Map.copyOf(RULES);
        }
}
