package com.hhkungfu.backend.module.admin.service;

import com.hhkungfu.backend.module.admin.dto.response.DashboardDataDto;
import com.hhkungfu.backend.module.admin.util.AdminRelativeTime;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.episode.repository.EpisodeRepository;
import com.hhkungfu.backend.module.subscription.repository.PaymentRepository;
import com.hhkungfu.backend.module.subscription.repository.UserSubscriptionRepository;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.repository.UserRepository;
import com.hhkungfu.backend.module.user.repository.WatchHistoryRepository;
import com.hhkungfu.backend.module.video.entity.TranscodeJob;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;
import com.hhkungfu.backend.module.video.repository.TranscodeJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final AnimeRepository animeRepository;
    private final EpisodeRepository episodeRepository;
    private final UserRepository userRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final TranscodeJobRepository transcodeJobRepository;

    @Transactional(readOnly = true)
    public DashboardDataDto getDashboard() {
        ZonedDateTime startOfToday = LocalDate.now(ZONE).atStartOfDay(ZONE);
        ZonedDateTime startOfMonth = LocalDate.now(ZONE).withDayOfMonth(1).atStartOfDay(ZONE);
        ZonedDateTime startOfNextMonth = startOfMonth.plusMonths(1).toLocalDate().atStartOfDay(ZONE);
        ZonedDateTime last24h = ZonedDateTime.now(ZONE).minusHours(24);

        long totalAnimes = animeRepository.countByDeletedAtIsNull();
        long totalEpisodes = episodeRepository.countByDeletedAtIsNull();
        long totalUsers = userRepository.count();
        long totalViews = episodeRepository.sumViewCountNotDeleted();
        long newUsersToday = userRepository.countByCreatedAtAfter(startOfToday);
        long viewsToday = watchHistoryRepository.countWatchedSince(startOfToday);

        BigDecimal revenueThisMonth = paymentRepository.sumPaidAmountBetween(startOfMonth, startOfNextMonth);
        long newSubscriptionsToday = userSubscriptionRepository.countCreatedActiveSince(startOfToday);

        int pending = (int) transcodeJobRepository.countByStatus(TranscodeJobStatus.QUEUED);
        int running = (int) transcodeJobRepository.countByStatus(TranscodeJobStatus.RUNNING);
        int failedLast24h = (int) transcodeJobRepository.countByStatusAndCompletedAtAfter(
                TranscodeJobStatus.FAILED, last24h.toLocalDateTime());

        List<DashboardDataDto.TopAnimeViewDto> topAnimes = animeRepository.findTop5ByDeletedAtIsNullOrderByViewCountDesc()
                .stream()
                .map(a -> DashboardDataDto.TopAnimeViewDto.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .viewCount(a.getViewCount() != null ? a.getViewCount() : 0L)
                        .build())
                .toList();

        List<DashboardDataDto.RecentActivityItemDto> recentActivity = buildRecentActivity();

        return DashboardDataDto.builder()
                .totalAnimes(totalAnimes)
                .totalEpisodes(totalEpisodes)
                .totalUsers(totalUsers)
                .totalViews(totalViews)
                .newUsersToday(newUsersToday)
                .viewsToday(viewsToday)
                .revenueThisMonth(revenueThisMonth != null ? revenueThisMonth : BigDecimal.ZERO)
                .newSubscriptionsToday(newSubscriptionsToday)
                .transcodeJobs(DashboardDataDto.TranscodeJobsSummaryDto.builder()
                        .pending(pending)
                        .running(running)
                        .failedLast24h(failedLast24h)
                        .build())
                .topAnimes(topAnimes)
                .recentActivity(recentActivity)
                .build();
    }

    private List<DashboardDataDto.RecentActivityItemDto> buildRecentActivity() {
        List<ActivityEntry> entries = new ArrayList<>();

        List<TranscodeJob> jobs = transcodeJobRepository.findRecentForActivity(PageRequest.of(0, 8));
        for (TranscodeJob t : jobs) {
            if (t.getEpisode() == null) {
                continue;
            }
            ZonedDateTime at = t.getCompletedAt() != null
                    ? t.getCompletedAt().atZone(ZONE)
                    : t.getCreatedAt().atZone(ZONE);
            if (t.getStatus() == TranscodeJobStatus.FAILED) {
                String epTitle = t.getEpisode().getAnime() != null
                        ? String.format("Tập %d %s", t.getEpisode().getEpisodeNumber(),
                                t.getEpisode().getAnime().getTitle())
                        : "ep#" + t.getEpisode().getId();
                entries.add(new ActivityEntry(at, "TRANSCODE_FAIL",
                        "Transcode thất bại: " + epTitle, AdminRelativeTime.viShort(at)));
            } else if (t.getStatus() == TranscodeJobStatus.DONE) {
                String epTitle = t.getEpisode().getAnime() != null
                        ? String.format("Tập %d %s", t.getEpisode().getEpisodeNumber(),
                                t.getEpisode().getAnime().getTitle())
                        : "ep#" + t.getEpisode().getId();
                entries.add(new ActivityEntry(at, "VIDEO_READY",
                        epTitle + " → READY", AdminRelativeTime.viShort(at)));
            }
        }

        List<User> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc();
        for (User u : recentUsers) {
            ZonedDateTime at = u.getCreatedAt();
            entries.add(new ActivityEntry(at, "USER_REGISTER",
                    u.getEmail() + " đăng ký", AdminRelativeTime.viShort(at)));
        }

        entries.sort(Comparator.comparing(ActivityEntry::time).reversed());
        return entries.stream()
                .limit(10)
                .map(e -> DashboardDataDto.RecentActivityItemDto.builder()
                        .type(e.type())
                        .message(e.message())
                        .at(e.atLabel())
                        .build())
                .toList();
    }

    private record ActivityEntry(ZonedDateTime time, String type, String message, String atLabel) {
    }
}
