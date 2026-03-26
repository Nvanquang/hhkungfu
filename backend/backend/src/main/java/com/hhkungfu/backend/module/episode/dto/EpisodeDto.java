package com.hhkungfu.backend.module.episode.dto;

import com.hhkungfu.backend.module.video.enums.VideoStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class EpisodeDto {
    private Long id;
    private Long animeId;
    private Integer episodeNumber;
    private String title;
    private String description;
    private String thumbnailUrl;
    private Boolean isVipOnly;
    private VideoStatus videoStatus;
    private String hlsBaseUrl;
    private Double durationSeconds;
    private Long fileSizeBytes;
    private Boolean hasVietsub;
    private Boolean hasEngsub;
    private Long viewCount;
    private LocalDate airedDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
