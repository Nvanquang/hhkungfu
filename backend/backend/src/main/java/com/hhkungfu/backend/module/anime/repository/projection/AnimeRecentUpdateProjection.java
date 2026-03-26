package com.hhkungfu.backend.module.anime.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Projection interface for recently updated animes, including the latest
 * episode number.
 */
public interface AnimeRecentUpdateProjection {
    Long getId();

    String getTitle();

    String getTitleVi();

    String getSlug();

    String getThumbnailUrl();

    String getBannerUrl();

    String getStatus();

    String getType();

    Integer getTotalEpisodes();

    Short getYear();

    BigDecimal getMalScore();

    Long getViewCount();

    Boolean getHasVipContent();

    LocalDateTime getCreatedAt();

    Integer getLatestEp();
}
