package app.together.auth.controller;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.dto.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import app.together.common.auth.dto.UserDto;
import app.together.common.auth.dto.ChangePasswordRequest;
import app.together.common.auth.dto.ConfirmPasswordResetRequest;
import app.together.common.auth.dto.GoogleLoginRequest;
import app.together.common.auth.dto.LoginRequest;
import app.together.common.auth.dto.LoginResponse;
import app.together.common.auth.dto.RefreshTokenRequest;
import app.together.common.auth.dto.RegisterRequest;
import app.together.common.auth.dto.ResetPasswordRequest;
import app.together.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static app.together.common.shared.dto.ApiResponse.ok;

@Tag(name = "Auth", description = "Auth API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ok(authService.login(request)));
    }

    @PostMapping("/google-login")
    public ResponseEntity<ApiResponse<LoginResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(ok(authService.loginWithGoogle(request.idToken())));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ok(authService.register(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok(ok(null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ok(authService.refreshToken(request.refreshToken())));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(@Valid @RequestBody ResetPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(ok(null));
    }

    @PostMapping("/reset-password/confirm")
    public ResponseEntity<ApiResponse<String>> confirmPasswordReset(@Valid @RequestBody ConfirmPasswordResetRequest request) {
        authService.confirmPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok(MessageConstants.MESSAGE_PASSWORD_RESET_CONFIRM_SUCCESS));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam String rawToken) {
        authService.verifyEmail(rawToken);
        return ResponseEntity.ok(ApiResponse.ok(MessageConstants.MESSAGE_EMAIL_VERIFY_SUCCESS));
    }

    @PostMapping("/dev-verify-all")
    public ResponseEntity<ApiResponse<String>> devVerifyAll() {
        authService.devVerifyAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("All users verified successfully"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePasswordRequest(request.oldPassword(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok(MessageConstants.MESSAGE_PASSWORD_CHANGE_SUCCESS));
    }

}
