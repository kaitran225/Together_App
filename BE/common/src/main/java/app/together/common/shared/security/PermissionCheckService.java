package app.together.common.shared.security;

import app.together.common.auth.enums.RoomRole;
import app.together.common.auth.enums.TeamRole;
import app.together.common.auth.enums.SystemRole;
import app.together.common.auth.enums.UserTier;
import app.together.common.shared.constant.ErrorCodes;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.util.SecurityUtils;
import org.springframework.stereotype.Service;

/**
 * Validates {@link Permission} against the static {@link PermissionMatrix} for
 * the current principal
 * or explicit roles/tier.
 */
@Service
public class PermissionCheckService {

    /* Các API không thuộc TEAM hay ROOM mà chỉ thuộc SYSTEM */
    public void requireSystemPermission(Permission permission) {
        SystemRole sys = SecurityUtils.getCurrentSystemRole().orElse(SystemRole.USER);
        UserTier tier = SecurityUtils.getCurrentUserTier().orElse(UserTier.FREE);
        boolean admin = SecurityUtils.isSystemAdmin();

        if (!PermissionMatrix.isGranted(permission, sys, null, null, tier, admin)) {
            throwForbidden();
        }
    }

    /* Các API thuộc ROOM */
    public void requireRoomRole(Permission permission, RoomRole roomRole) {
        SystemRole sys = SecurityUtils.getCurrentSystemRole().orElse(SystemRole.USER);
        UserTier tier = SecurityUtils.getCurrentUserTier().orElse(UserTier.FREE);
        boolean admin = SecurityUtils.isSystemAdmin();

        if (!PermissionMatrix.isGranted(permission, sys, roomRole, null, tier, admin)) {
            throwForbidden();
        }
    }
 
    /* Các API thuộc TEAM */
    public void requireTeamRole(Permission permission, TeamRole teamRole) {
        SystemRole sys = SecurityUtils.getCurrentSystemRole().orElse(SystemRole.USER);
        UserTier tier = SecurityUtils.getCurrentUserTier().orElse(UserTier.FREE);
        boolean admin = SecurityUtils.isSystemAdmin();

        if (!PermissionMatrix.isGranted(permission, sys, null, teamRole, tier, admin)) {
            throwForbidden();
        }
    }

    public void requireExplicit(
            Permission permission,
            SystemRole systemRole,
            RoomRole roomRole,
            TeamRole teamRole,
            UserTier userTier,
            boolean platformAdmin) {
        if (!PermissionMatrix.isGranted(permission, systemRole, roomRole, teamRole, userTier, platformAdmin)) {
            throwForbidden();
        }
    }

    private void throwForbidden() {
        throw new ForbiddenException(
                MessageConstants.MESSAGE_PERMISSION_DENIED,
                ErrorCodes.PERMISSION_DENIED);
    }
}
