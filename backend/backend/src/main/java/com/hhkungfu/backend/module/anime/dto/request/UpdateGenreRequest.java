package com.hhkungfu.backend.module.anime.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record UpdateGenreRequest(
    @NotBlank(message = "Genre name is required")
    String name,
    
    String nameVi,
    
    @NotBlank(message = "Genre slug is required")
    String slug
) {}
