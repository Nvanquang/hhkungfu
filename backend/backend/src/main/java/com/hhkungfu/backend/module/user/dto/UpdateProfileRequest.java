package com.hhkungfu.backend.module.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 3, max = 50, message = "Username phải từ 3 đến 50 ký tự") @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username chỉ gồm chữ, số và dấu gạch dưới") String username,

        @Size(max = 500, message = "URL ảnh đại diện quá dài") String avatarUrl,

        @Size(max = 1000, message = "Bio quá dài") String bio) {
}
