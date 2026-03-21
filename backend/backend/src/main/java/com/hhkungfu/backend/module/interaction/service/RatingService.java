package com.hhkungfu.backend.module.interaction.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.interaction.dto.RatingSummaryDto;
import com.hhkungfu.backend.module.interaction.entity.Rating;
import com.hhkungfu.backend.module.interaction.entity.RatingId;
import com.hhkungfu.backend.module.interaction.repository.RatingRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final AnimeRepository animeRepository;

    @Transactional
    public void rateAnime(String userIdStr, Long animeId, int score) {
        UUID userId = UUID.fromString(userIdStr);

        if (!animeRepository.existsById(animeId)) {
            throw new ResourceNotFoundException("Anime không tồn tại", "ANIME",
                    ErrorConstants.ANIME_NOT_FOUND.getCode());
        }

        if (score < 1 || score > 10) {
            throw new IllegalArgumentException("Điểm rating phải từ 1 đến 10");
        }

        RatingId id = new RatingId(userId, animeId);
        Rating rating = ratingRepository.findById(id)
                .orElse(Rating.builder().id(id).build());

        rating.setScore(score);
        ratingRepository.save(rating);
    }

    @Transactional(readOnly = true)
    public Integer getMyRating(String userIdStr, Long animeId) {
        UUID userId = UUID.fromString(userIdStr);
        return ratingRepository.findById(new RatingId(userId, animeId))
                .map(Rating::getScore)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public RatingSummaryDto getRatingSummary(Long animeId) {
        Double avg = ratingRepository.getAverageScore(animeId);
        List<Map<String, Object>> distList = ratingRepository.getScoreDistribution(animeId);

        Map<Integer, Long> distribution = distList.stream()
                .collect(Collectors.toMap(
                        m -> (Integer) m.get("score"),
                        m -> (Long) m.get("count")));

        long total = distribution.values().stream().mapToLong(Long::longValue).sum();

        return RatingSummaryDto.builder()
                .averageScore(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalRatings(total)
                .distribution(distribution)
                .build();
    }
}
