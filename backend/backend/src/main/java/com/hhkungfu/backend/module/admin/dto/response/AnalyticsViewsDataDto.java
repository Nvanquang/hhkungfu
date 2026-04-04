package com.hhkungfu.backend.module.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

@Getter
@Builder
public class AnalyticsViewsDataDto {
    private final String period;
    private final long totalViews;
    private final Double viewsDelta;
    private final BigDecimal totalRevenue;
    private final Double revenueDelta;
    private final long newUsers;
    private final Double usersDelta;
    private final long activeVipUsers;
    private final Double vipDelta;
    
    private final List<TopAnimeViewsDto> topAnimes;
    private final List<TopGenreViewsDto> topGenres;
    private final List<DailyViewsDto> viewsChart;
    private final List<DailyRevenueDto> revenueChart;
    
    private final SubscriptionStatsDto subscriptionStats;
    private final EngagementStatsDto engagementStats;
    private final TranscodeHealthDto transcodeHealth;

    @Getter
    @Builder
    public static class TopAnimeViewsDto {
        private final Long id;
        private final String title;
        private final long views;
    }

    @Getter
    @Builder
    public static class TopGenreViewsDto {
        private final String name;
        private final String nameVi;
        private final long views;
    }

    @Getter
    @Builder
    public static class DailyViewsDto {
        private final String date;
        private final long views;
    }

    @Getter
    @Builder
    public static class DailyRevenueDto {
        private final String date;
        private final BigDecimal amount;
    }

    @Getter
    @Builder
    public static class SubscriptionStatsDto {
        private final List<PlanRevenueDto> revenueByPlan;
        private final List<GatewayRatioDto> gatewayStats;
    }

    @Getter
    @Builder
    public static class PlanRevenueDto {
        private final String planName;
        private final BigDecimal amount;
        private final long orderCount;
    }

    @Getter
    @Builder
    public static class GatewayRatioDto {
        private final String gateway;
        private final BigDecimal amount;
        private final double percentage;
    }

    @Getter
    @Builder
    public static class EngagementStatsDto {
        private final long totalComments;
        private final Double commentsDelta;
        private final long totalRatings;
        private final Double ratingsDelta;
        private final List<TopEpisodeCommentDto> topCommentedEpisodes;
    }

    @Getter
    @Builder
    public static class TopEpisodeCommentDto {
        private final Long episodeId;
        private final String episodeTitle;
        private final String animeTitle;
        private final long commentCount;
    }

    @Getter
    @Builder
    public static class TranscodeHealthDto {
        private final long totalJobs;
        private final long successJobs;
        private final long failedJobs;
        private final long activeJobs;
        private final double successRate;
        private final List<RecentFailedJobDto> recentFailed;
    }

    @Getter
    @Builder
    public static class RecentFailedJobDto {
        private final Long jobId;
        private final Long episodeId;
        private final String error;
        private final ZonedDateTime at;
    }
}
