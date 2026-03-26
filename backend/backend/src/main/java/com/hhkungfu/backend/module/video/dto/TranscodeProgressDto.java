package com.hhkungfu.backend.module.video.dto;

import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TranscodeProgressDto {
    private Long jobId;
    private TranscodeJobStatus status;
    private Integer progress;
    private String currentStep;
    private String masterUrl;
    private String error;
}
