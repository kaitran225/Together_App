package app.together.common.auth.dto;


public record LoginResponse(
        String accessToken,
        String refreshToken
) {
}
