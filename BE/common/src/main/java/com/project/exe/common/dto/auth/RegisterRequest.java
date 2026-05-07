package com.project.exe.common.dto.auth;

import com.project.exe.common.util.ValidPassword;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @Size(max = 255)
    @NotBlank
    @Email(message = "Email không hợp lệ")
    @Pattern(
            regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
            message = "Email phải có domain hợp lệ (vd: gmail.com)"
    )
    private String email;

    @ValidPassword
    @NotBlank
    private String password;

//    @NotBlank(message = "Full name is required")
//    @Size(max = 255)
//    private String fullName;
}
