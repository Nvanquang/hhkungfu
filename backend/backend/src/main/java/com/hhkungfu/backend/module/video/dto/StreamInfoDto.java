package com.hhkungfu.backend.module.video.dto;

import com.hhkungfu.backend.module.video.enums.VideoStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StreamInfoDto {
    private Long episodeId;
    private VideoStatus videoStatus;
    private String masterUrl;
    private List<QualityDto> qualities;
    private List<SubtitleDto> subtitles;
    private Double durationSeconds;

    @Data
    @Builder
    public static class QualityDto {
        private String quality;
        private String url;
    }

    @Data
    @Builder
    public static class SubtitleDto {
        private String language;
        private String label;
        private String url;
    }
}
