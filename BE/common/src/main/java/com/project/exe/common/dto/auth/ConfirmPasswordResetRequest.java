package com.project.exe.common.dto.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.project.exe.common.util.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmPasswordResetRequest {
    @NotBlank(message = "Token is required")
    @JsonAlias({"resetToken", "code"})
    private String token;


    @NotBlank(message = "New password is required")
    @JsonAlias({"password", "new_password"})
    @ValidPassword
    private String newPassword;
}
