package app.together.common.auth.dto;

import app.together.common.shared.util.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Size(max = 255)
        @NotBlank
        @Email(message = "Email is not valid")
        @Pattern(
                regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
                message = "Email must be a valid email address"
        )
        String email,
        @ValidPassword
        @NotBlank
        String password,
        @NotBlank(message = "Full name is required")
        @Size(max = 255)
        String fullName
) {
}
