package com.hhkungfu.backend.module.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRatingStatsDto {
    private Long animeId;
    private String animeTitleVi;
    private Double averageScore;
    private Long totalRatings;
    private Double fiveStarPercentage;
    private Map<Integer, Long> scoreDistribution; // 1 to 10
    
    // Trend info (optional for now)
    private Double scoreTrend; // e.g., +0.12
    private Double countTrend; // percentage change in rating volume compared to last month
}
