package com.project.exe.read.controller;

import com.project.exe.common.constant.ErrorCodes;
import com.project.exe.common.dto.ApiResponse;
import com.project.exe.common.dto.UserDto;
import com.project.exe.common.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.project.exe.common.dto.ApiResponse.ok;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

        private final AuthService authService;

        @GetMapping("/me")
        public ResponseEntity<ApiResponse<UserDto>> me(JwtAuthenticationToken authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("Not authenticated", ErrorCodes.UNAUTHORIZED));
        }
        String userSso = authentication.getToken().getSubject();
        System.out.println("userSso: " + userSso);

        UserDto user = authService.getCurrentUser(userSso);
        return ResponseEntity.ok(ok(user));
        }


}
