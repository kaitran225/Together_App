package com.project.exe.auth.controller;

import com.project.exe.common.dto.ApiResponse;
import com.project.exe.common.dto.UserDto;
import com.project.exe.common.dto.auth.*;
import com.project.exe.common.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import static com.project.exe.common.dto.ApiResponse.ok;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ok(authService.login(request)));
    }

    @PostMapping("/google-login")
    public ResponseEntity<ApiResponse<LoginResponse>> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        return ResponseEntity.ok(ok(authService.loginWithGoogle(idToken)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ok(authService.register(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ok(null));
    }

//    @GetMapping("/me")
//    public ResponseEntity<ApiResponse<UserDto>> me(JwtAuthenticationToken authentication) {
//        if (authentication == null) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                    .body(ApiResponse.fail("Not authenticated", ErrorCodes.UNAUTHORIZED));
//        }
//        String userEmail = authentication.getToken().getSubject();
//        System.out.println("userEmail: " + userEmail);
//        System.out.println("Claims: " + authentication.getToken().getClaims().toString());
//
//        UserDto user = authService.getCurrentUser(userEmail);
//        return ResponseEntity.ok(ok(user));
//    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ok(authService.refreshToken(request.getRefreshToken())));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> requestPasswordReset(@Valid @RequestBody ResetPasswordRequest request) {
        authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(ok(null));
    }

    @PostMapping("/reset-password/confirm")
    public ResponseEntity<ApiResponse<String>> confirmPasswordReset(@Valid @RequestBody ConfirmPasswordResetRequest request) {
        authService.confirmPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok("Xác thực password thành công!"));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam String tokenEmail) {
        authService.verifyEmail(tokenEmail);
        return ResponseEntity.ok(ApiResponse.ok("Xác thực Email thành công!"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePasswordRequest(request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok("Đổi password thành công!"));
    }

}
