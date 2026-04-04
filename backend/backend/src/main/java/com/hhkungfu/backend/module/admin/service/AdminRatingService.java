package com.hhkungfu.backend.module.admin.service;

import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.admin.dto.AdminRatingStatsDto;
import com.hhkungfu.backend.module.admin.dto.AdminRatingSummaryDto;
import com.hhkungfu.backend.module.anime.entity.Anime;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.anime.repository.AnimeSpecifications;
import com.hhkungfu.backend.module.interaction.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.ZonedDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminRatingService {

    private final AnimeRepository animeRepository;
    private final RatingRepository ratingRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminRatingStatsDto> getAnimeRatingStats(String search, Pageable pageable) {
        Page<Anime> animePage = animeRepository.findAll(AnimeSpecifications.searchByTitleVi(search), pageable);

        List<AdminRatingStatsDto> items = animePage.getContent().stream()
                .map(anime -> {
                    Double avg = ratingRepository.getAverageScore(anime.getId());
                    long total = ratingRepository.countById_AnimeId(anime.getId());
                    
                    List<Map<String, Object>> distributionRaw = ratingRepository.getScoreDistribution(anime.getId());
                    Map<Integer, Long> distribution = new HashMap<>();
                    // Initialize 1-10 with 0
                    for (int i = 1; i <= 10; i++) distribution.put(i, 0L);
                    
                    distributionRaw.forEach(m -> {
                        Object scoreObj = m.get("score");
                        Object countObj = m.get("count");
                        if (scoreObj instanceof Integer score && countObj instanceof Long count) {
                            distribution.put(score, count);
                        }
                    });

                    long fiveStarCount = distribution.getOrDefault(9, 0L) + distribution.getOrDefault(10, 0L);
                    double fiveStarPercentage = total > 0 ? (fiveStarCount * 100.0) / total : 0.0;

                    ZonedDateTime now = ZonedDateTime.now();
                    ZonedDateTime currentWindowStart = now.minusDays(30);
                    ZonedDateTime previousWindowStart = now.minusDays(60);
                    long currentPeriodCount = ratingRepository.countById_AnimeIdAndCreatedAtBetween(anime.getId(), currentWindowStart, now);
                    long previousPeriodCount = ratingRepository.countById_AnimeIdAndCreatedAtBetween(anime.getId(), previousWindowStart, currentWindowStart);
                    double countTrend = 0.0;
                    if (previousPeriodCount > 0) {
                        countTrend = ((currentPeriodCount - previousPeriodCount) * 100.0) / previousPeriodCount;
                    } else if (currentPeriodCount > 0) {
                        countTrend = 100.0;
                    }

                    return AdminRatingStatsDto.builder()
                            .animeId(anime.getId())
                            .animeTitleVi(anime.getTitleVi())
                            .averageScore(avg != null ? avg : 0.0)
                            .totalRatings(total)
                            .fiveStarPercentage(fiveStarPercentage)
                            .scoreDistribution(distribution)
                            .countTrend(countTrend)
                            .build();
                })
                .collect(Collectors.toList());

        return PageResponse.<AdminRatingStatsDto>builder()
                .items(items)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(pageable.getPageNumber() + 1)
                        .limit(pageable.getPageSize())
                        .total(animePage.getTotalElements())
                        .totalPages(animePage.getTotalPages())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public AdminRatingSummaryDto getAnimeRatingSummary() {
        Double averageScore = ratingRepository.getAverageScoreAll();
        long totalRatings = ratingRepository.count();
        long positiveRatings = ratingRepository.countByScoreGreaterThanEqual(8);
        double positiveRatio = totalRatings > 0 ? (positiveRatings * 100.0) / totalRatings : 0.0;

        java.time.ZonedDateTime now = java.time.ZonedDateTime.now();
        java.time.ZonedDateTime currentWindowStart = now.minusDays(30);
        java.time.ZonedDateTime previousWindowStart = now.minusDays(60);
        long currentPeriodCount = ratingRepository.countByCreatedAtBetween(currentWindowStart, now);
        long previousPeriodCount = ratingRepository.countByCreatedAtBetween(previousWindowStart, currentWindowStart);
        double monthlyTrend = previousPeriodCount > 0 ? ((currentPeriodCount - previousPeriodCount) * 100.0) / previousPeriodCount : 0.0;

        return AdminRatingSummaryDto.builder()
                .averageScore(averageScore != null ? averageScore : 0.0)
                .totalRatings(totalRatings)
                .positiveRatio(positiveRatio)
                .monthlyTrend(monthlyTrend)
                .build();
    }
}
