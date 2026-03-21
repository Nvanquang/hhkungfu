package com.hhkungfu.backend.module.user.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmChangePasswordRequest(
    @NotBlank(message = "Mã OTP không được để trống")
    String otpCode
) {}
