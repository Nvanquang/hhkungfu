package com.hhkungfu.backend.module.admin.dto.request;

import jakarta.validation.constraints.NotNull;

public record PatchAnimeFeaturedRequest(@NotNull Boolean isFeatured) {
}
