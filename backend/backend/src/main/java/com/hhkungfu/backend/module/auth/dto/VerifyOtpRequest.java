package com.hhkungfu.backend.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,

        @NotBlank(message = "Mã OTP không được để trống") @Size(min = 6, max = 6, message = "Mã OTP phải có 6 ký tự") String otpCode) {
}
