package com.hhkungfu.backend.module.interaction.dto;

import lombok.Builder;
import java.util.Map;

@Builder
public record RatingSummaryDto(
        Double averageScore,
        long totalRatings,
        Map<Integer, Long> distribution) {
}
