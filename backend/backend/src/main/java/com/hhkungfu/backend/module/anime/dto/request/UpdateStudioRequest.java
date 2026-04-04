package com.hhkungfu.backend.module.anime.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record UpdateStudioRequest(
    @NotBlank(message = "Studio name is required")
    String name,
    
    String logoUrl
) {}
