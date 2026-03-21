package com.hhkungfu.backend.module.interaction.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import lombok.Builder;

@Builder
public record BookmarkDto(
        Long animeId,
        String animeTitle,
        String slug,
        String thumbnail,
        Double averageScore,
        String status,
        String type,
        Integer totalEpisodes,
        Integer year,
        Boolean hasVipContent,
        ZonedDateTime bookmarkedAt) {
    // Constructor for JPQL "SELECT new" mapping
    public BookmarkDto(
            Long animeId,
            String animeTitle,
            String slug,
            String thumbnail,
            BigDecimal averageScore,
            Enum<?> status,
            Enum<?> type,
            Integer totalEpisodes,
            Short year,
            Boolean hasVipContent,
            ZonedDateTime bookmarkedAt) {
        this(
                animeId,
                animeTitle,
                slug,
                thumbnail,
                averageScore != null ? averageScore.doubleValue() : null,
                status != null ? status.name() : null,
                type != null ? type.name() : null,
                totalEpisodes,
                year != null ? year.intValue() : null,
                hasVipContent,
                bookmarkedAt);
    }
}
