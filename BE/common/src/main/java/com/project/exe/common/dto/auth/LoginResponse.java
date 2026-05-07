package com.project.exe.common.dto.auth;

import lombok.Data;

@Data
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private long expiresIn;
    private long refreshTokenExpiresIn;
    private String plan_type;
    private int exp;
}
