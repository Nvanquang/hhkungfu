package com.hhkungfu.backend.module.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRatingSummaryDto {
    private Double averageScore;
    private Long totalRatings;
    private Double positiveRatio;
    private Double monthlyTrend;
}
