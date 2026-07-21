package app.together.common.shared.security;

import app.together.common.auth.enums.SystemRole;
import app.together.common.auth.enums.RoomRole;
import app.together.common.auth.enums.TeamRole;
import app.together.common.auth.enums.UserTier;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * One conjunct in the permission matrix: caller must match every
 * <em>non-empty</em> role/tier set
 * (AND within this record). For a {@link Permission}, the matrix stores a list
 * of rules; access is
 * granted only when <strong>every</strong> rule in that list {@link #matches
 * matches} (AND across rules).
 * <p>
 * Empty set on an axis means no constraint on that axis.
 */
public record PermissionRule(
        Set<SystemRole> systemRoles,
        Set<RoomRole> roomRoles,
        Set<TeamRole> teamRoles,
        Set<UserTier> userTiers) {

    public PermissionRule {

        systemRoles = systemRoles == null || systemRoles.isEmpty()
                ? EnumSet.noneOf(SystemRole.class)
                : EnumSet.copyOf(systemRoles);
        roomRoles = roomRoles == null || roomRoles.isEmpty()
                ? EnumSet.noneOf(RoomRole.class)
                : EnumSet.copyOf(roomRoles);
        teamRoles = teamRoles == null || teamRoles.isEmpty()
                ? EnumSet.noneOf(TeamRole.class)
                : EnumSet.copyOf(teamRoles);
        userTiers = userTiers == null || userTiers.isEmpty()
                ? EnumSet.noneOf(UserTier.class)
                : EnumSet.copyOf(userTiers);
    }

    /**
     * All of these rules must match (use in {@link PermissionMatrix} row
     * definitions).
     */
    public static List<PermissionRule> allOf(PermissionRule first, PermissionRule... rest) {
        if (rest.length == 0) {
            return List.of(first);
        }
        PermissionRule[] all = new PermissionRule[rest.length + 1];
        all[0] = first;
        System.arraycopy(rest, 0, all, 1, rest.length);
        return List.of(all);
    }

    public static PermissionRule of(
            Set<SystemRole> systemRoles,
            Set<RoomRole> roomRoles,
            Set<TeamRole> teamRoles,
            Set<UserTier> userTiers) {
        return new PermissionRule(systemRoles, roomRoles, teamRoles, userTiers);
    }

    public static PermissionRule systemOnly(SystemRole first, SystemRole... rest) {
        return new PermissionRule(EnumSet.of(first, rest), null, null, null);
    }

    public static PermissionRule roomRole(Set<SystemRole> sys, Set<RoomRole> rooms) {
        return new PermissionRule(sys, rooms, null, null);
    }

    public static PermissionRule teamRole(Set<SystemRole> sys, Set<TeamRole> teams) {
        return new PermissionRule(sys, null, teams, null);
    }

    public static PermissionRule tierOnly(UserTier first, UserTier... rest) {
        return new PermissionRule(null, null, null, EnumSet.of(first, rest));
    }

    public boolean matches(SystemRole systemRole, RoomRole roomRole, TeamRole teamRole, UserTier userTier) {
        boolean sysOk  = systemRoles.isEmpty() || (systemRole != null && systemRoles.contains(systemRole));
        boolean roomOk = roomRoles.isEmpty()   || (roomRole != null && roomRoles.contains(roomRole));
        boolean teamOk = teamRoles.isEmpty()   || (teamRole != null && teamRoles.contains(teamRole));
        boolean tierOk = userTiers.isEmpty()   || (userTier != null && userTiers.contains(userTier));
        
        return sysOk && roomOk && teamOk && tierOk;
    }
}
