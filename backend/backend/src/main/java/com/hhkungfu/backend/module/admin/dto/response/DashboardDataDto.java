package com.hhkungfu.backend.module.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class DashboardDataDto {
    private final long totalAnimes;
    private final long totalEpisodes;
    private final long totalUsers;
    private final long totalViews;
    private final long newUsersToday;
    private final long viewsToday;
    private final BigDecimal revenueThisMonth;
    private final long newSubscriptionsToday;
    private final TranscodeJobsSummaryDto transcodeJobs;
    private final List<TopAnimeViewDto> topAnimes;
    private final List<RecentActivityItemDto> recentActivity;

    @Getter
    @Builder
    public static class TranscodeJobsSummaryDto {
        private final int pending;
        private final int running;
        private final int failedLast24h;
    }

    @Getter
    @Builder
    public static class TopAnimeViewDto {
        private final Long id;
        private final String title;
        private final long viewCount;
    }

    @Getter
    @Builder
    public static class RecentActivityItemDto {
        private final String type;
        private final String message;
        private final String at;
    }
}
