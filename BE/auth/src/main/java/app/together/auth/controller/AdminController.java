package app.together.auth.controller;

import app.together.auth.service.UserService;
import app.together.common.auth.dto.UserDto;
import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin", description = "Admin API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/users")
public class AdminController {

    private final UserService userService;
    private final PermissionCheckService permissionCheckService;

    @PostMapping("/{userId}/toggle-status")
    public ResponseEntity<ApiResponse<UserDto>> toggleUserStatus(@PathVariable Long userId) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);
        UserDto updatedUser = userService.toggleUserStatus(userId);
        return ResponseEntity.ok(ApiResponse.ok(updatedUser));
    }
}
