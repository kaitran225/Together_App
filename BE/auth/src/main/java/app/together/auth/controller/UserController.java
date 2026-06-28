package app.together.auth.controller;

import app.together.auth.service.UserService;
import app.together.common.auth.dto.UserDto;
import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "User API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe() {
        String userSso = SecurityUtils.requireCurrentUserSso();
        UserDto userDto = userService.getUserDtoBySso(userSso);
        return ResponseEntity.ok(ApiResponse.ok(userDto));
    }
}
