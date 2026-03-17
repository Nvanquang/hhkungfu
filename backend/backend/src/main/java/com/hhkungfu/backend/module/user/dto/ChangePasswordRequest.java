package com.hhkungfu.backend.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Mật khẩu cũ không được để trống") String oldPassword,

        @NotBlank(message = "Mật khẩu mới không được để trống") @Size(min = 8, message = "Password phải tối thiểu 8 ký tự") @Pattern(regexp = "^(?=.*[A-Z])(?=.*\\d).*$", message = "Password phải có ít nhất 1 chữ hoa và 1 số") String newPassword) {
}
