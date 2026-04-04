package com.hhkungfu.backend.module.admin.service;

import com.hhkungfu.backend.module.admin.dto.response.AnalyticsViewsDataDto;
import com.hhkungfu.backend.module.video.entity.TranscodeJob;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;
import com.hhkungfu.backend.module.video.repository.TranscodeJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final JdbcTemplate jdbcTemplate;
    private final TranscodeJobRepository transcodeJobRepository;

    @Transactional(readOnly = true)
    public AnalyticsViewsDataDto getViewsAnalytics(String period, int limit) {
        ZonedDateTime now = ZonedDateTime.now(ZONE);
        String p = period == null || period.isBlank() ? "week" : period.trim().toLowerCase();
        
        ZonedDateTime currentFrom;
        long days;
        
        if ("today".equals(p)) {
            days = 1;
            currentFrom = now.toLocalDate().atStartOfDay(ZONE);
        } else if ("month".equals(p)) {
            days = 30;
            currentFrom = now.toLocalDate().minusDays(29).atStartOfDay(ZONE);
        } else {
            // Default to week (7 days)
            days = 7;
            currentFrom = now.toLocalDate().minusDays(6).atStartOfDay(ZONE);
        }

        ZonedDateTime previousFrom = currentFrom.minusDays(days);
        ZonedDateTime previousTo = currentFrom.minusNanos(1);

        // 1. Core Metrics
        Timestamp cFrom = Timestamp.from(currentFrom.toInstant());
        Timestamp cTo = Timestamp.from(now.toInstant());
        
        long totalViews = getViewsCount(cFrom, cTo);
        BigDecimal totalRevenue = getRevenueSum(cFrom, cTo);
        
        // 2. User Growth
        long newUsers = getNewUsersCount(cFrom, cTo);
        long activeVipUsers = getActiveVipCount(); // Total active now
        
        // 3. Previous Metrics for Delta
        Timestamp pFrom = Timestamp.from(previousFrom.toInstant());
        Timestamp pTo = Timestamp.from(previousTo.toInstant());
        
        long prevViews = getViewsCount(pFrom, pTo);
        BigDecimal prevRevenue = getRevenueSum(pFrom, pTo);
        long prevUsers = getNewUsersCount(pFrom, pTo);
        long prevActiveVip = getActiveVipCountAt(pTo);

        Double viewsDelta = calculateDelta(totalViews, prevViews);
        Double revenueDelta = calculateDelta(totalRevenue.doubleValue(), prevRevenue.doubleValue());
        Double usersDelta = calculateDelta(newUsers, prevUsers);
        Double vipDelta = calculateDelta(activeVipUsers, prevActiveVip);

        // 4. Top Lists
        List<AnalyticsViewsDataDto.TopAnimeViewsDto> topAnimes = jdbcTemplate.query(
                """
                        SELECT a.id, a.title, COUNT(*) AS views
                        FROM watch_history wh
                        JOIN episodes e ON e.id = wh.episode_id
                        JOIN animes a ON a.id = e.anime_id
                        WHERE wh.watched_at >= ? AND wh.watched_at <= ?
                        GROUP BY a.id, a.title
                        ORDER BY views DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> AnalyticsViewsDataDto.TopAnimeViewsDto.builder()
                        .id(rs.getLong("id"))
                        .title(rs.getString("title"))
                        .views(rs.getLong("views"))
                        .build(),
                cFrom, cTo, limit);

        List<AnalyticsViewsDataDto.TopGenreViewsDto> topGenres = jdbcTemplate.query(
                """
                        SELECT g.name, g.name_vi, COUNT(*) AS views
                        FROM watch_history wh
                        JOIN episodes e ON e.id = wh.episode_id
                        JOIN anime_genres ag ON ag.anime_id = e.anime_id
                        JOIN genres g ON g.id = ag.genre_id
                        WHERE wh.watched_at >= ? AND wh.watched_at <= ?
                        GROUP BY g.id, g.name, g.name_vi
                        ORDER BY views DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> AnalyticsViewsDataDto.TopGenreViewsDto.builder()
                        .name(rs.getString("name"))
                        .nameVi(rs.getString("name_vi"))
                        .views(rs.getLong("views"))
                        .build(),
                cFrom, cTo, limit);

        List<AnalyticsViewsDataDto.DailyViewsDto> viewsChartRaw = jdbcTemplate.query(
                """
                        SELECT CAST(watched_at AS DATE) AS d, COUNT(*)::bigint AS views
                        FROM watch_history
                        WHERE watched_at >= ? AND watched_at <= ?
                        GROUP BY CAST(watched_at AS DATE)
                        ORDER BY d ASC
                        """,
                (rs, rowNum) -> AnalyticsViewsDataDto.DailyViewsDto.builder()
                        .date(rs.getDate("d").toLocalDate().toString())
                        .views(rs.getLong("views"))
                        .build(),
                cFrom, cTo);

        List<AnalyticsViewsDataDto.DailyRevenueDto> revenueChartRaw = jdbcTemplate.query(
                """
                        SELECT CAST(paid_at AS DATE) AS d, COALESCE(SUM(amount), 0) AS amount
                        FROM payments
                        WHERE status = 'PAID' AND paid_at >= ? AND paid_at <= ?
                        GROUP BY CAST(paid_at AS DATE)
                        ORDER BY d ASC
                        """,
                (rs, rowNum) -> AnalyticsViewsDataDto.DailyRevenueDto.builder()
                        .date(rs.getDate("d").toLocalDate().toString())
                        .amount(rs.getBigDecimal("amount"))
                        .build(),
                cFrom, cTo);

        // Fill gaps for charts
        List<AnalyticsViewsDataDto.DailyViewsDto> viewsChart = new ArrayList<>();
        List<AnalyticsViewsDataDto.DailyRevenueDto> revenueChart = new ArrayList<>();
        
        for (int i = 0; i < days; i++) {
            String dateStr = currentFrom.toLocalDate().plusDays(i).toString();
            
            long v = viewsChartRaw.stream()
                .filter(d -> d.getDate().equals(dateStr))
                .findFirst()
                .map(AnalyticsViewsDataDto.DailyViewsDto::getViews)
                .orElse(0L);
            viewsChart.add(AnalyticsViewsDataDto.DailyViewsDto.builder().date(dateStr).views(v).build());

            BigDecimal r = revenueChartRaw.stream()
                .filter(d -> d.getDate().equals(dateStr))
                .findFirst()
                .map(AnalyticsViewsDataDto.DailyRevenueDto::getAmount)
                .orElse(BigDecimal.ZERO);
            revenueChart.add(AnalyticsViewsDataDto.DailyRevenueDto.builder().date(dateStr).amount(r).build());
        }

        // 6. Subscription Stats
        List<AnalyticsViewsDataDto.PlanRevenueDto> revenueByPlan = jdbcTemplate.query(
                """
                        SELECT sp.name, COALESCE(SUM(p.amount), 0) AS amount, COUNT(p.id) AS count
                        FROM payments p
                        JOIN user_subscriptions us ON us.id = p.subscription_id
                        JOIN subscription_plans sp ON sp.id = us.plan_id
                        WHERE p.status = 'PAID' AND p.paid_at >= ? AND p.paid_at <= ?
                        GROUP BY sp.id, sp.name
                        ORDER BY amount DESC
                        """,
                (rs, rowNum) -> AnalyticsViewsDataDto.PlanRevenueDto.builder()
                        .planName(rs.getString("name"))
                        .amount(rs.getBigDecimal("amount"))
                        .orderCount(rs.getLong("count"))
                        .build(),
                cFrom, cTo);

        List<AnalyticsViewsDataDto.GatewayRatioDto> gatewayStats = jdbcTemplate.query(
                """
                        SELECT gateway, COALESCE(SUM(amount), 0) AS amount
                        FROM payments
                        WHERE status = 'PAID' AND paid_at >= ? AND paid_at <= ?
                        GROUP BY gateway
                        """,
                (rs, rowNum) -> {
                    BigDecimal amt = rs.getBigDecimal("amount");
                    double ratio = totalRevenue.compareTo(BigDecimal.ZERO) > 0 
                        ? amt.multiply(new BigDecimal(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP).doubleValue()
                        : 0.0;
                    return AnalyticsViewsDataDto.GatewayRatioDto.builder()
                        .gateway(rs.getString("gateway"))
                        .amount(amt)
                        .percentage(ratio)
                        .build();
                },
                cFrom, cTo);

        // 7. Engagement
        long totalComments = getCommentsCount(cFrom, cTo);
        long prevComments = getCommentsCount(pFrom, pTo);
        Double commentsDelta = calculateDelta(totalComments, prevComments);

        long totalRatings = getRatingsCount(cFrom, cTo);
        long prevRatings = getRatingsCount(pFrom, pTo);
        Double ratingsDelta = calculateDelta(totalRatings, prevRatings);

        List<AnalyticsViewsDataDto.TopEpisodeCommentDto> topCommented = jdbcTemplate.query(
                """
                        SELECT e.id, e.title AS e_title, a.title AS a_title, COUNT(c.id) AS comments
                        FROM comments c
                        JOIN episodes e ON e.id = c.episode_id
                        JOIN animes a ON a.id = e.anime_id
                        WHERE c.created_at >= ? AND c.created_at <= ?
                        GROUP BY e.id, e.title, a.title
                        ORDER BY comments DESC
                        LIMIT 5
                        """,
                (rs, rowNum) -> AnalyticsViewsDataDto.TopEpisodeCommentDto.builder()
                        .episodeId(rs.getLong("id"))
                        .episodeTitle(rs.getString("e_title"))
                        .animeTitle(rs.getString("a_title"))
                        .commentCount(rs.getLong("comments"))
                        .build(),
                cFrom, cTo);

        // 8. Pipeline Health
        long totalJobs = transcodeJobRepository.count();
        long successJobs = transcodeJobRepository.countByStatus(TranscodeJobStatus.DONE);
        long failedJobs = transcodeJobRepository.countByStatus(TranscodeJobStatus.FAILED);
        long activeJobs = transcodeJobRepository.countByStatus(TranscodeJobStatus.QUEUED)
                + transcodeJobRepository.countByStatus(TranscodeJobStatus.RUNNING);

        double successRate = totalJobs == 0 ? 100.0
                : BigDecimal.valueOf(successJobs * 100.0 / totalJobs).setScale(1, RoundingMode.HALF_UP).doubleValue();

        List<TranscodeJob> recentFailed = transcodeJobRepository.findRecentByStatusWithEpisode(
                TranscodeJobStatus.FAILED, PageRequest.of(0, 5));

        List<AnalyticsViewsDataDto.RecentFailedJobDto> recentFailedDtos = new ArrayList<>();
        for (TranscodeJob j : recentFailed) {
            ZonedDateTime at = j.getCompletedAt() != null
                    ? j.getCompletedAt().atZone(ZONE)
                    : j.getCreatedAt().atZone(ZONE);
            recentFailedDtos.add(AnalyticsViewsDataDto.RecentFailedJobDto.builder()
                    .jobId(j.getId())
                    .episodeId(j.getEpisode() != null ? j.getEpisode().getId() : null)
                    .error(j.getErrorMessage())
                    .at(at)
                    .build());
        }

        AnalyticsViewsDataDto.TranscodeHealthDto health = AnalyticsViewsDataDto.TranscodeHealthDto.builder()
                .totalJobs(totalJobs)
                .successJobs(successJobs)
                .failedJobs(failedJobs)
                .activeJobs(activeJobs)
                .successRate(successRate)
                .recentFailed(recentFailedDtos)
                .build();

        return AnalyticsViewsDataDto.builder()
                .period(p)
                .totalViews(totalViews)
                .viewsDelta(viewsDelta)
                .totalRevenue(totalRevenue)
                .revenueDelta(revenueDelta)
                .newUsers(newUsers)
                .usersDelta(usersDelta)
                .activeVipUsers(activeVipUsers)
                .vipDelta(vipDelta)
                .topAnimes(topAnimes)
                .topGenres(topGenres)
                .viewsChart(viewsChart)
                .revenueChart(revenueChart)
                .subscriptionStats(AnalyticsViewsDataDto.SubscriptionStatsDto.builder()
                        .revenueByPlan(revenueByPlan)
                        .gatewayStats(gatewayStats)
                        .build())
                .engagementStats(AnalyticsViewsDataDto.EngagementStatsDto.builder()
                        .totalComments(totalComments)
                        .commentsDelta(commentsDelta)
                        .totalRatings(totalRatings)
                        .ratingsDelta(ratingsDelta)
                        .topCommentedEpisodes(topCommented)
                        .build())
                .transcodeHealth(health)
                .build();
    }

    private long getViewsCount(Timestamp from, Timestamp to) {
        Long res = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM watch_history WHERE watched_at >= ? AND watched_at <= ?",
                Long.class, from, to);
        return res != null ? res : 0L;
    }

    private BigDecimal getRevenueSum(Timestamp from, Timestamp to) {
        BigDecimal res = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'PAID' AND paid_at >= ? AND paid_at <= ?",
                BigDecimal.class, from, to);
        return res != null ? res : BigDecimal.ZERO;
    }

    private long getNewUsersCount(Timestamp from, Timestamp to) {
        Long res = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE created_at >= ? AND created_at <= ?",
                Long.class, from, to);
        return res != null ? res : 0L;
    }

    private long getActiveVipCount() {
        Long res = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT user_id) FROM user_subscriptions WHERE status = 'ACTIVE' AND expires_at > CURRENT_TIMESTAMP",
                Long.class);
        return res != null ? res : 0L;
    }

    private long getActiveVipCountAt(Timestamp at) {
        Long res = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT user_id) FROM user_subscriptions WHERE created_at <= ? AND expires_at > ?",
                Long.class, at, at);
        return res != null ? res : 0L;
    }

    private long getCommentsCount(Timestamp from, Timestamp to) {
        Long res = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM comments WHERE created_at >= ? AND created_at <= ? AND deleted_at IS NULL",
                Long.class, from, to);
        return res != null ? res : 0L;
    }

    private long getRatingsCount(Timestamp from, Timestamp to) {
        Long res = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ratings WHERE created_at >= ? AND created_at <= ?",
                Long.class, from, to);
        return res != null ? res : 0L;
    }

    private Double calculateDelta(double current, double previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        return ((current - previous) / previous) * 100.0;
    }
}
