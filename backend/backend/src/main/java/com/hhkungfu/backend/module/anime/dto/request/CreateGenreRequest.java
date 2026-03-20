package com.hhkungfu.backend.module.anime.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateGenreRequest(
    @NotBlank @Size(max = 50) String name,
    @Size(max = 50) String nameVi,
    @NotBlank @Size(max = 50) @Pattern(regexp = "^[a-z0-9-]+$") String slug
) {}
