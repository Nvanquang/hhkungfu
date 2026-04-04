package com.hhkungfu.backend.module.anime.dto.request;

import com.hhkungfu.backend.module.anime.enums.AgeRating;
import com.hhkungfu.backend.module.anime.enums.AnimeStatus;
import com.hhkungfu.backend.module.anime.enums.AnimeType;
import com.hhkungfu.backend.module.anime.enums.Season;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateAnimeRequest(
        @NotBlank @Size(max = 255) String title,
        @Size(max = 255) String titleVi,
        List<String> titleOther,
        @NotBlank @Size(max = 255) @Pattern(regexp = "^[a-z0-9-]+$") String slug,
        String description,
        @NotNull AnimeStatus status,
        @NotNull AnimeType type,
        Integer totalEpisodes,
        Integer episodeDuration,
        LocalDate airedFrom,
        LocalDate airedTo,
        Season season,
        Short year,
        AgeRating ageRating,
        @DecimalMin("0.0") @DecimalMax("10.0") BigDecimal malScore,
        Boolean isFeatured,
        List<Long> genreIds,
        List<Long> studioIds) {
}
