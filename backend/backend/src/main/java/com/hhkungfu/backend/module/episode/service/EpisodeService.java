package com.hhkungfu.backend.module.episode.service;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.common.response.PageResponse;
import org.springframework.data.domain.Page;
import com.hhkungfu.backend.module.anime.entity.Anime;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.episode.dto.CreateEpisodeRequest;
import com.hhkungfu.backend.module.episode.dto.EpisodeDto;
import com.hhkungfu.backend.module.episode.entity.Episode;
import com.hhkungfu.backend.module.episode.entity.Subtitle;
import com.hhkungfu.backend.module.episode.repository.EpisodeRepository;
import com.hhkungfu.backend.module.episode.repository.SubtitleRepository;
import com.hhkungfu.backend.module.video.dto.StreamInfoDto;
import com.hhkungfu.backend.module.video.enums.VideoStatus;
import com.hhkungfu.backend.module.video.service.VideoTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EpisodeService {

    private final EpisodeRepository episodeRepository;
    private final AnimeRepository animeRepository;
    private final SubtitleRepository subtitleRepository;
    @Value("${app.api.base-url:http://localhost:8080}")
    private String apiBaseUrl;
    private final RedisTemplate<String, Object> redisTemplate;
    private final VideoTokenService videoTokenService;

    // ── CRUD ──────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PageResponse<EpisodeDto> getEpisodesByAnime(Long animeId, int page, int limit) {
        var pageable = PageRequest.of(page - 1, limit, Sort.by("episodeNumber").ascending());
        Page<Episode> episodePage = episodeRepository.findByAnimeIdAndDeletedAtIsNull(animeId, pageable);

        // Filter episodes that have aired (airedDate <= current date)
        LocalDateTime now = LocalDateTime.now();
        List<EpisodeDto> items = episodePage.getContent().stream()
                .filter(episode -> episode.getAiredDate() != null && !episode.getAiredDate().isAfter(now.toLocalDate()))
                .map(this::toDto)
                .collect(Collectors.toList());

        return PageResponse.<EpisodeDto>builder()
                .items(items)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(page)
                        .limit(limit)
                        .total(episodePage.getTotalElements())
                        .totalPages(episodePage.getTotalPages())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public EpisodeDto getEpisodeByNumber(Long animeId, Integer episodeNumber) {
        Episode ep = episodeRepository.findByAnimeIdAndEpisodeNumberAndDeletedAtIsNull(animeId, episodeNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Tập phim không tồn tại", "EPISODE",
                        ErrorConstants.EPISODE_NOT_FOUND.getCode()));
        return toDto(ep);
    }

    @Transactional
    public EpisodeDto createEpisode(Long animeId, CreateEpisodeRequest request) {
        Anime anime = animeRepository.findById(animeId)
                .orElseThrow(() -> new ResourceNotFoundException("Hoạt hình không tồn tại", "ANIME",
                        ErrorConstants.ANIME_NOT_FOUND.getCode()));

        Integer maxEpisodeNumber = episodeRepository.findMaxEpisodeNumberByAnimeId(animeId);
        int nextEpisodeNumber = (maxEpisodeNumber == null) ? 1 : maxEpisodeNumber + 1;

        boolean exists = episodeRepository
                .findByAnimeIdAndEpisodeNumberAndDeletedAtIsNull(animeId, nextEpisodeNumber)
                .isPresent();
        if (exists) {
            throw new BusinessException("Số tập đã tồn tại trong hoạt hình này", "EPISODE",
                    ErrorConstants.EPISODE_NUMBER_EXISTS.getCode());
        }

        Episode episode = Episode.builder()
                .anime(anime)
                .episodeNumber(nextEpisodeNumber)
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .isVipOnly(Boolean.TRUE.equals(request.getIsVipOnly()))
                .hasVietsub(Boolean.TRUE.equals(request.getHasVietsub()))
                .hasEngsub(Boolean.TRUE.equals(request.getHasEngsub()))
                .airedDate(request.getAiredDate() == null ? LocalDate.now() : request.getAiredDate())
                .videoStatus(VideoStatus.PENDING)
                .build();

        return toDto(episodeRepository.save(episode));
    }

    @Transactional
    public void softDeleteEpisode(Long episodeId) {
        Episode ep = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tập phim không tồn tại", "EPISODE",
                        ErrorConstants.EPISODE_NOT_FOUND.getCode()));
        ep.setDeletedAt(java.time.LocalDateTime.now());
        episodeRepository.save(ep);
        invalidateCache(episodeId);
    }

    // ── Stream Info ──────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public StreamInfoDto getStreamInfo(Long episodeId, UUID userId) {
        Episode ep = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tập phim không tồn tại", "EPISODE",
                        ErrorConstants.EPISODE_NOT_FOUND.getCode()));

        if (ep.getVideoStatus() != VideoStatus.READY) {
            throw new BusinessException("Tập phim chưa sẵn sàng để phát", "EPISODE",
                    ErrorConstants.EPISODE_NOT_READY.getCode());
        }

        if (Boolean.TRUE.equals(ep.getIsVipOnly())) {
            // Redis VIP check (cache 5 min)
            String vipKey = "vip:status:" + userId;
            Boolean isVip = (Boolean) redisTemplate.opsForValue().get(vipKey);
            if (isVip == null) {
                // No subscription module yet — default to false; plug subscription check here
                // later
                isVip = false;
                redisTemplate.opsForValue().set(vipKey, isVip, Duration.ofMinutes(5));
            }
            if (!isVip) {
                throw new BusinessException("Yêu cầu gói VIP", "EPISODE",
                        ErrorConstants.VIP_REQUIRED.getCode());
            }
        }

        // Generate token
        String token = videoTokenService.generateToken(episodeId, userId != null ? userId.toString() : null);

        // Increment counters
        redisTemplate.opsForValue().increment("viewcount:ep:" + episodeId);
        redisTemplate.opsForZSet().incrementScore("anime:trending", ep.getAnime().getId().toString(), 1.0);

        return buildStreamInfo(ep, token);
    }

    // ── View Count ───────────────────────────────────────────────────────
    public void incrementView(Long episodeId) {
        redisTemplate.opsForValue().increment("viewcount:ep:" + episodeId);
        episodeRepository.findById(episodeId).ifPresent(ep -> redisTemplate.opsForZSet()
                .incrementScore("anime:trending", ep.getAnime().getId().toString(), 1.0));
    }

    @Transactional
    public void syncViewsToDb() {
        Set<String> keys = redisTemplate.keys("viewcount:ep:*");
        if (keys == null || keys.isEmpty())
            return;

        for (String key : keys) {
            Object val = redisTemplate.opsForValue().getAndSet(key, 0);
            if (val == null)
                continue;

            long delta = Long.parseLong(val.toString());
            if (delta > 0) {
                try {
                    Long episodeId = Long.parseLong(key.substring("viewcount:ep:".length()));
                    episodeRepository.incrementViewCount(episodeId, delta);
                    log.debug("Synced {} views for episode {}", delta, episodeId);
                } catch (Exception e) {
                    log.error("Failed to sync views for key: {}", key, e);
                    // Rollback Redis if DB update fails
                    redisTemplate.opsForValue().increment(key, delta);
                }
            }
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────
    private StreamInfoDto buildStreamInfo(Episode ep, String token) {
        String hlsBaseUrl = ep.getHlsBaseUrl();
        String masterUrl;
        String baseDir;

        if (hlsBaseUrl != null) {
            if (hlsBaseUrl.endsWith("/master.m3u8")) {
                masterUrl = hlsBaseUrl;
                baseDir = hlsBaseUrl.substring(0, hlsBaseUrl.lastIndexOf("/"));
            } else {
                baseDir = hlsBaseUrl;
                masterUrl = baseDir + "/master.m3u8";
            }
        } else {
            // Always use API endpoints instead of direct storage URLs
            String apiBaseUrl = getApiBaseUrl();
            baseDir = apiBaseUrl + "/" + ep.getId();
            masterUrl = baseDir + "/master.m3u8";
        }

        if (token != null) {
            masterUrl += "?token=" + token;
        }

        List<StreamInfoDto.QualityDto> qualities = new ArrayList<>();
        qualities.add(StreamInfoDto.QualityDto.builder().quality("360p").url(baseDir + "/360p/index.m3u8").build());
        qualities.add(StreamInfoDto.QualityDto.builder().quality("720p").url(baseDir + "/720p/index.m3u8").build());

        List<Subtitle> subtitles = subtitleRepository.findByEpisodeId(ep.getId());
        List<StreamInfoDto.SubtitleDto> subtitleDtos = subtitles.stream()
                .map(s -> StreamInfoDto.SubtitleDto.builder()
                        .language(s.getLanguage())
                        .label(s.getLabel())
                        .url(s.getUrl())
                        .build())
                .collect(Collectors.toList());

        return StreamInfoDto.builder()
                .episodeId(ep.getId())
                .videoStatus(ep.getVideoStatus())
                .masterUrl(masterUrl)
                .qualities(qualities)
                .subtitles(subtitleDtos)
                .durationSeconds(ep.getDurationSeconds())
                .build();
    }

    private EpisodeDto toDto(Episode e) {
        return EpisodeDto.builder()
                .id(e.getId())
                .animeId(e.getAnime() != null ? e.getAnime().getId() : null)
                .episodeNumber(e.getEpisodeNumber())
                .title(e.getTitle())
                .description(e.getDescription())
                .thumbnailUrl(e.getThumbnailUrl())
                .isVipOnly(e.getIsVipOnly())
                .videoStatus(e.getVideoStatus())
                .hlsBaseUrl(e.getHlsBaseUrl())
                .vttUrl(e.getVideoStatus() == VideoStatus.READY ? getApiBaseUrl() + "/" + e.getId() + "/thumbnails/thumbnails.vtt" : null)
                .durationSeconds(e.getDurationSeconds())
                .fileSizeBytes(e.getFileSizeBytes())
                .hasVietsub(e.getHasVietsub())
                .hasEngsub(e.getHasEngsub())
                .viewCount(e.getViewCount())
                .airedDate(e.getAiredDate())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private void invalidateCache(Long episodeId) {
        redisTemplate.delete("episode:" + episodeId);
        redisTemplate.delete("episode:" + episodeId + ":stream");
    }

    // Helper method to get API base URL for HLS endpoints
    private String getApiBaseUrl() {
        return apiBaseUrl + "/api/v1/files/hls";
    }
}
