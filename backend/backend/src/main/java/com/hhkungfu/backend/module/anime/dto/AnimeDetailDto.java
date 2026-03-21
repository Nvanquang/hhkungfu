package com.hhkungfu.backend.module.anime.dto;

import com.hhkungfu.backend.module.anime.enums.AnimeStatus;
import com.hhkungfu.backend.module.anime.enums.AnimeType;
import com.hhkungfu.backend.module.anime.enums.Season;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class AnimeDetailDto {
    private Long id;
    private String title;
    private String titleVi;
    private List<String> titleOther;
    private String slug;
    private String description;
    private String thumbnailUrl;
    private String bannerUrl;
    private AnimeStatus status;
    private AnimeType type;
    private Integer totalEpisodes;
    private Integer episodeDuration;
    private LocalDate airedFrom;
    private LocalDate airedTo;
    private Season season;
    private Short year;
    private String ageRating; // Converted to string for response
    private BigDecimal malScore;
    private Long viewCount;
    private Boolean isFeatured;
    private Boolean hasVipContent;
    private List<GenreDto> genres;
    private List<StudioDto> studios;
    private BigDecimal averageRating;
    private Integer totalRatings;
    private Boolean isBookmarked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
