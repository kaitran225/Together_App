package app.together.common.auth.dto;

import app.together.common.shared.constant.MessageConstants;
import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
        @NotBlank(message = MessageConstants.MESSAGE_GOOGLE_ID_TOKEN_REQUIRED)
        String idToken
) {
}
