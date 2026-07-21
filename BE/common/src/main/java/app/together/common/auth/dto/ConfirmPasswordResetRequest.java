package app.together.common.auth.dto;

import app.together.common.shared.util.ValidPassword;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record ConfirmPasswordResetRequest(
        @NotBlank(message = "Token is required")
        @JsonAlias({"resetToken", "code"})
        String token,
        @NotBlank(message = "New password is required")
        @JsonAlias({"password", "new_password"})
        @ValidPassword
        String newPassword
) {
}
