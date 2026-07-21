package app.together.common.auth.dto;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.util.ValidPassword;
import jakarta.validation.constraints.NotBlank;

public record ChangePasswordRequest(
        @ValidPassword
        @NotBlank(message = MessageConstants.MESSAGE_USER_OLD_PASSWORD_REQUIRED)
        String oldPassword,
        @NotBlank(message = MessageConstants.MESSAGE_USER_NEW_PASSWORD_REQUIRED)
        @ValidPassword
        String newPassword
) {
}
