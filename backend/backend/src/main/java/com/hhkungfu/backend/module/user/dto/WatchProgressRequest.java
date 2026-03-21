package com.hhkungfu.backend.module.user.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record WatchProgressRequest(
    @NotNull(message = "Episode ID không được để trống")
    Long episodeId,

    @Min(value = 0, message = "Tiến trình không được nhỏ hơn 0")
    int progressSeconds,

    boolean isCompleted
) {}
