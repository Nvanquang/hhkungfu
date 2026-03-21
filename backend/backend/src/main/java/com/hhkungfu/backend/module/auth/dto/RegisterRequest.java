package com.hhkungfu.backend.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
                @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,

                @NotBlank(message = "Username không được để trống") @Size(min = 3, max = 50, message = "Username phải từ 3 đến 50 ký tự") String username,

                @NotBlank(message = "Password không được để trống") @Size(min = 8, message = "Password phải tối thiểu 8 ký tự") @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).*$", message = "Password phải có ít nhất 1 chữ hoa và 1 số") String password) {
}
