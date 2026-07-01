package app.together.auth.controller;

import app.together.auth.service.UserService;
import app.together.common.auth.dto.UpdateUserRequest;
import app.together.common.auth.dto.UserDto;
import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.shared.util.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "User", description = "User API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final PermissionCheckService permissionCheckService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe() {
        String userSso = SecurityUtils.requireCurrentUserSso();
        UserDto userDto = userService.getUserDtoBySso(userSso);
        return ResponseEntity.ok(ApiResponse.ok(userDto));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateMe(@Valid @RequestBody UpdateUserRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        UserDto updatedUser = userService.updateProfile(userSso, request);
        return ResponseEntity.ok(ApiResponse.ok(updatedUser));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsers() {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUserDtos()));
    }
}
