package app.together.auth.controller;

import app.together.auth.service.UserService;
import app.together.common.auth.dto.UserDto;
import app.together.common.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Public User", description = "Public User API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public/users")
public class PublicUserController {

    private final UserService userService;

    @GetMapping("/{sso}/profile")
    public ResponseEntity<ApiResponse<UserDto>> getPublicProfile(@PathVariable String sso) {
        UserDto userDto = userService.getUserDtoBySso(sso);
        // Only return safe public info (strip out email if desired, but let's just return it for now)
        return ResponseEntity.ok(ApiResponse.ok(userDto));
    }
}
