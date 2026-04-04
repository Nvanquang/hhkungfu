package com.hhkungfu.backend.module.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 3, max = 50, message = "Username phải từ 3 đến 50 ký tự") String username,

        @Size(max = 1000, message = "Bio quá dài") String bio) {
}
