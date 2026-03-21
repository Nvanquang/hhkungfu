package com.hhkungfu.backend.module.user.dto;

import lombok.Builder;
import java.time.ZonedDateTime;

@Builder
public record WatchHistoryDto(
    Long animeId,
    String animeTitle,
    String animeSlug,
    String thumbnail,
    Long lastEpisodeId,
    Integer lastEpisodeNumber,
    String lastEpisodeTitle,
    Integer durationSeconds,
    Integer progressSeconds,
    ZonedDateTime watchedAt,
    Boolean isCompleted
) {
    // Required for BUILDER and standard record usage
    public WatchHistoryDto(
            Long animeId, 
            String animeTitle, 
            String animeSlug,
            String thumbnail, 
            Long lastEpisodeId, 
            Integer lastEpisodeNumber, 
            String lastEpisodeTitle,
            Integer durationSeconds,
            Integer progressSeconds, 
            ZonedDateTime watchedAt,
            Boolean isCompleted
    ) {
        this.animeId = animeId;
        this.animeTitle = animeTitle;
        this.animeSlug = animeSlug;
        this.thumbnail = thumbnail;
        this.lastEpisodeId = lastEpisodeId;
        this.lastEpisodeNumber = lastEpisodeNumber;
        this.lastEpisodeTitle = lastEpisodeTitle;
        this.durationSeconds = durationSeconds;
        this.progressSeconds = progressSeconds;
        this.watchedAt = watchedAt;
        this.isCompleted = isCompleted;
    }
}
