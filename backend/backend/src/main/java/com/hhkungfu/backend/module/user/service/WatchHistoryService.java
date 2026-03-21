package com.hhkungfu.backend.module.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.episode.entity.Episode;
import com.hhkungfu.backend.module.episode.repository.EpisodeRepository;
import com.hhkungfu.backend.module.user.dto.WatchHistoryDto;
import com.hhkungfu.backend.module.user.dto.WatchProgressRequest;
import com.hhkungfu.backend.module.user.entity.WatchHistory;
import com.hhkungfu.backend.module.user.entity.WatchHistoryId;
import com.hhkungfu.backend.module.user.repository.WatchHistoryRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WatchHistoryService {

    private final WatchHistoryRepository watchHistoryRepository;
    private final EpisodeRepository episodeRepository;

    @Transactional
    public void updateProgress(String userIdStr, WatchProgressRequest request) {
        UUID userId = UUID.fromString(userIdStr);
        if (!episodeRepository.existsById(request.episodeId())) {
            throw new ResourceNotFoundException("Episode không tồn tại", "EPISODE",
                    ErrorConstants.ANIME_NOT_FOUND.getCode());
        }

        WatchHistoryId id = new WatchHistoryId(userId, request.episodeId());
        WatchHistory history = watchHistoryRepository.findById(id)
                .orElse(WatchHistory.builder()
                        .id(id)
                        .build());

        history.setProgressSeconds(request.progressSeconds());
        history.setCompleted(request.isCompleted());
        // watchedAt wordt automatisch bijgewerkt door @UpdateTimestamp

        watchHistoryRepository.save(history);
    }

    @Transactional(readOnly = true)
    public Page<WatchHistoryDto> getMyWatchHistory(String userIdStr, Pageable pageable) {
        UUID userId = UUID.fromString(userIdStr);
        return watchHistoryRepository.findLatestGroupByAnime(userId, pageable);
    }

    @Transactional(readOnly = true)
    public WatchHistoryDto getAnimeWatchHistory(String userIdStr, Long animeId) {
        UUID userId = UUID.fromString(userIdStr);
        List<WatchHistory> historyList = watchHistoryRepository.findByUserIdAndAnimeId(userId, animeId);

        if (historyList.isEmpty()) {
            return null;
        }

        // Neem de meest recente entry
        WatchHistory history = historyList.get(0);
        Episode episode = episodeRepository.findById(history.getId().getEpisodeId()).orElse(null);

        if (episode == null)
            return null;

        return WatchHistoryDto.builder()
                .animeId(animeId)
                .animeTitle(episode.getAnime().getTitle())
                .animeSlug(episode.getAnime().getSlug())
                .thumbnail(episode.getAnime().getThumbnailUrl())
                .lastEpisodeId(episode.getId())
                .lastEpisodeNumber(episode.getEpisodeNumber())
                .lastEpisodeTitle(episode.getTitle())
                .durationSeconds(episode.getAnime().getEpisodeDuration())
                .progressSeconds(history.getProgressSeconds())
                .watchedAt(history.getWatchedAt())
                .isCompleted(history.isCompleted())
                .build();
    }

    @Transactional
    public void clearHistory(String userIdStr) {
        UUID userId = UUID.fromString(userIdStr);
        watchHistoryRepository.deleteByIdUserId(userId);
    }
}
