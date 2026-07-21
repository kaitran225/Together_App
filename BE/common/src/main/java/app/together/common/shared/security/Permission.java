package app.together.common.shared.security;

/**
 * Application permissions. Each constant carries:
 * <ul>
 * <li>{@link #code()} — stable id for APIs, logs, and config (do not rename
 * casually).</li>
 * <li>{@link #minTierLevel()} — suggested floor vs
 * {@link app.together.common.auth.enums.UserTier#level()};
 * {@code -1} means “no default here”; {@link PermissionMatrix} remains
 * authoritative until you wire this.</li>
 * <li>{@link #sensitivity()} — coarse rank for auditing / UI (higher = more
 * privileged).</li>
 * </ul>
 * Add new enum constants as features ship; keep existing {@link #code()} values
 * stable.
 */
public enum Permission {
    // USER
    USER_SELF_READ("user.self.read", -1, 0),

    USER_SELF_WRITE("user.self.write", -1, 1),

    // ROOM
    ROOM_CREATE("room.create", -1, 1),

    ROOM_JOIN("room.join", -1, 0),

    ROOM_CHAT("room.chat", -1, 0),

    ROOM_SHARE_CAMERA("room.share.camera", -1, 1),

    ROOM_SHARE_MIC("room.share.mic", -1, 1),

    ROOM_SHARE_SCREEN("room.share.screen", -1, 1),

    ROOM_KICK_MEMBER("room.kick.member", -1, 2),

    ROOM_MODERATE("room.moderate", -1, 2),

    ROOM_DELETE("room.delete", -1, 3),

    // TEAM
    TEAM_CREATE("team.create", -1, 1),

    TEAM_EDIT("team.edit", -1, 2),

    TEAM_DELETE("team.delete", -1, 3),

    TEAM_INVITE_MEMBER("team.invite.member", -1, 2),

    TEAM_REMOVE_MEMBER("team.remove.member", -1, 2),

    TEAM_MEETING_CREATE("team.meeting.create", -1, 1),

    TEAM_MEETING_JOIN("team.meeting.join", -1, 0),

    TEAM_REPORT_VIEW("team.report.view", -1, 2),

    // TEAM_MANAGE("team.manage", -1, 2),

    // TASK
    TASK_CREATE("task.create", -1, 1),

    TASK_ASSIGN("task.assign", -1, 2),

    TASK_UPDATE("task.update", -1, 1),

    TASK_DELETE("task.delete", -1, 2),

    TASK_EVALUATE("task.evaluate", -1, 2),

    // PERSONAL_SPACE
    PERSONAL_SPACE_READ("personal.space.read", -1, 0),

    PERSONAL_SPACE_WRITE("personal.space.write", -1, 1),

    //AI FEATURES (LLM Server)
    AI_CHAT_USE("ai.chat.use", -1, 1), // Chat với bot

    AI_GENERATE_QUIZ("ai.generate.quiz", -1, 1), // Gen Quiz

    AI_GENERATE_FLASHCARD("ai.generate.flashcard", -1, 1), // Gen Flashcard

    AI_GENERATE_MINDMAP("ai.generate.mindmap", -1, 1), // Gen Mindmap text

    // WORKFLOW
    WORKFLOW_READ("workflow.read", -1, 0),

    WORKFLOW_WRITE("workflow.write", -1, 1),

    // SYSTEM PLATFORM
    ORG_ADMIN_ACTIONS("org.admin.actions", -1, 3),

    PLATFORM_AUDIT_READ("platform.audit.read", -1, 3),

    PLATFORM_CONFIG_WRITE("platform.config.write", -1, 4);

    private final String code;
    /** {@code -1} = no tier hint on the permission itself. */
    private final int minTierLevel;
    private final int sensitivity;

    Permission(String code, int minTierLevel, int sensitivity) {
        this.code = code;
        this.minTierLevel = minTierLevel;
        this.sensitivity = sensitivity;
    }

    public String code() {
        return code;
    }

    public int minTierLevel() {
        return minTierLevel;
    }

    public int sensitivity() {
        return sensitivity;
    }

    /** Match {@link #code()}; returns {@code null} if unknown or blank. */
    public static Permission fromCode(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();
        for (Permission p : values()) {
            if (p.code.equals(s)) {
                return p;
            }
        }
        return null;
    }
}
