package com.hhkungfu.backend.module.anime.dto;

import com.hhkungfu.backend.module.anime.enums.AnimeStatus;
import com.hhkungfu.backend.module.anime.enums.AnimeType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AnimeSummaryDto {
    private Long id;
    private String title;
    private String titleVi;
    private String slug;
    private String thumbnailUrl;
    private String bannerUrl;
    private AnimeStatus status;
    private AnimeType type;
    private Integer totalEpisodes;
    private Short year;
    private BigDecimal malScore;
    private Long viewCount;
    private Boolean hasVipContent;
    private List<GenreDto> genres;
    private LocalDateTime createdAt;
}
