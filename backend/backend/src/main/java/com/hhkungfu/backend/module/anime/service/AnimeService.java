package com.hhkungfu.backend.module.anime.service;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.anime.dto.AnimeDetailDto;
import com.hhkungfu.backend.module.anime.dto.AnimeSummaryDto;
import com.hhkungfu.backend.module.anime.dto.request.AnimeFilterRequest;
import com.hhkungfu.backend.module.anime.dto.request.CreateAnimeRequest;
import com.hhkungfu.backend.module.anime.dto.request.UpdateAnimeRequest;
import com.hhkungfu.backend.module.anime.entity.Anime;
import com.hhkungfu.backend.module.anime.entity.Genre;
import com.hhkungfu.backend.module.anime.entity.Studio;
import com.hhkungfu.backend.module.anime.mapper.AnimeMapper;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.anime.repository.GenreRepository;
import com.hhkungfu.backend.module.anime.repository.StudioRepository;

import jakarta.persistence.criteria.Join;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnimeService {

    private final AnimeRepository animeRepository;
    private final GenreRepository genreRepository;
    private final StudioRepository studioRepository;
    private final AnimeMapper animeMapper;

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PageResponse<AnimeSummaryDto> getAnimes(AnimeFilterRequest req) {

        // Build specification
        Specification<Anime> spec = buildSpec(req);

        // Build pageable (convert 1-based page từ client → 0-based cho Spring)
        Pageable pageable = buildPageable(req);

        // Query
        Page<Anime> page = animeRepository.findAll(spec, pageable);

        // Map to DTO
        List<AnimeSummaryDto> items = page.getContent()
                .stream()
                .map(animeMapper::toSummaryDto)
                .toList();

        return PageResponse.<AnimeSummaryDto>builder()
                .items(items)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(req.getPage()) // trả lại đúng page client gửi
                        .limit(req.getLimit())
                        .total(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .build())
                .build();
    }

    // ─── Private helpers ─────────────────────────────────────────────────────────

    private Specification<Anime> buildSpec(AnimeFilterRequest req) {
        return Specification
                .where(deletedAtIsNull())
                .and(filterByStatus(req.getStatus()))
                .and(filterByType(req.getType()))
                .and(filterByYear(req.getYear()))
                .and(filterByTitle(req.getKey()))
                .and(filterByGenre(req.getGenre()));
    }

    private Pageable buildPageable(AnimeFilterRequest req) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(req.getOrder())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        String sortField = switch (req.getSortBy() != null ? req.getSortBy().toUpperCase() : "") {
            case "POPULAR" -> "viewCount";
            case "SCORE" -> "malScore";
            case "YEAR" -> "year";
            default -> "createdAt"; // NEWEST hoặc fallback
        };

        return PageRequest.of(
                req.getPage() - 1, // ← 1-based → 0-based
                req.getLimit(),
                Sort.by(direction, sortField));
    }

    private Specification<Anime> deletedAtIsNull() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    private Specification<Anime> filterByStatus(String status) {
        return status == null ? null
                : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private Specification<Anime> filterByType(String type) {
        return type == null ? null
                : (root, query, cb) -> cb.equal(root.get("type"), type);
    }

    private Specification<Anime> filterByYear(Integer year) {
        return year == null ? null
                : (root, query, cb) -> cb.equal(root.get("year"), year);
    }

    private Specification<Anime> filterByTitle(String title) {
        return title == null ? null
                : (root, query, cb) -> {
                    String keyword = "%" + title.toLowerCase() + "%";

                    return cb.or(
                            cb.like(
                                    cb.function("unaccent", String.class,
                                            cb.lower(root.get("title"))),
                                    keyword),
                            cb.like(
                                    cb.function("unaccent", String.class,
                                            cb.lower(root.get("titleVi"))),
                                    keyword));
                };
    }

    private Specification<Anime> filterByGenre(String genre) {
        return genre == null ? null
                : (root, query, cb) -> {
                    Join<Object, Object> genres = root.join("genres");
                    return cb.equal(genres.get("slug"), genre);
                };
    }

    @Transactional(readOnly = true)
    public AnimeDetailDto getByIdOrSlug(String idOrSlug) {
        String cacheKey = (idOrSlug.matches("\\d+")) ? "anime:" + idOrSlug : "anime:slug:" + idOrSlug;

        // 1. Check Redis Cache
        String cachedJson = redisTemplate.opsForValue().get(cacheKey);
        if (cachedJson != null) {
            try {
                return objectMapper.readValue(cachedJson, AnimeDetailDto.class);
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize anime from cache key: {}", cacheKey);
            }
        }

        // 2. Query DB
        Anime anime = (idOrSlug.matches("\\d+")) ? animeRepository.findByIdAndDeletedAtIsNull(Long.parseLong(idOrSlug))
                .orElseThrow(() -> new ResourceNotFoundException("Anime not found", "ANIME", "ANIME_NOT_FOUND"))
                : animeRepository.findBySlugAndDeletedAtIsNull(idOrSlug)
                        .orElseThrow(
                                () -> new ResourceNotFoundException("Anime not found", "ANIME", "ANIME_NOT_FOUND"));

        AnimeDetailDto dto = animeMapper.toDetailDto(anime);

        // 3. Save to Cache
        try {
            String json = objectMapper.writeValueAsString(dto);
            redisTemplate.opsForValue().set(cacheKey, json, Duration.ofHours(1));
            // also cache the other key if possible
            String otherKey = (idOrSlug.matches("\\d+")) ? "anime:slug:" + anime.getSlug() : "anime:" + anime.getId();
            redisTemplate.opsForValue().set(otherKey, json, Duration.ofHours(1));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize anime detail dto", e);
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public PageResponse<AnimeSummaryDto> getFeaturedAnimes(int limit) {
        String cacheKey = "anime:featured";
        String cachedJson = redisTemplate.opsForValue().get(cacheKey);
        if (cachedJson != null) {
            try {
                return objectMapper.readValue(cachedJson,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, AnimeSummaryDto.class));
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize featured animes");
            }
        }

        List<Anime> animes = animeRepository.findFeaturedAnimes(limit);
        List<AnimeSummaryDto> dtos = animes.stream().map(animeMapper::toSummaryDto).toList();

        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(dtos), Duration.ofMinutes(10));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize featured animes", e);
        }

        PageResponse<AnimeSummaryDto> response = PageResponse.<AnimeSummaryDto>builder()
                .items(dtos)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(1)
                        .limit(limit)
                        .total(dtos.size())
                        .totalPages(1)
                        .build())
                .build();

        return response;
    }

    @Transactional(readOnly = true)
    public PageResponse<AnimeSummaryDto> getRecentlyUpdated(Pageable pageable) {
        Page<Anime> page = animeRepository.findRecentlyUpdated(pageable);
        List<AnimeSummaryDto> dtos = page.getContent().stream().map(animeMapper::toSummaryDto).toList();
        return PageResponse.<AnimeSummaryDto>builder()
                .items(dtos)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(pageable.getPageNumber() + 1)
                        .limit(pageable.getPageSize())
                        .total(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<AnimeSummaryDto> getRelated(Long id, Pageable pageable) {
        Page<Anime> page = animeRepository.findRelatedAnimes(id, pageable);
        List<AnimeSummaryDto> dtos = page.getContent().stream().map(animeMapper::toSummaryDto).toList();
        return PageResponse.<AnimeSummaryDto>builder()
                .items(dtos)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(pageable.getPageNumber() + 1)
                        .limit(pageable.getPageSize())
                        .total(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .build())
                .build();
    }

    @Transactional
    public AnimeDetailDto createAnime(CreateAnimeRequest request) {
        if (animeRepository.existsBySlug(request.slug())) {
            throw new BusinessException("Slug already exists", "ANIME", "SLUG_ALREADY_EXISTS");
        }

        Anime anime = animeMapper.toEntity(request);

        if (request.genreIds() != null && !request.genreIds().isEmpty()) {
            List<Genre> genres = genreRepository.findAllById(request.genreIds());
            anime.setGenres(new HashSet<>(genres));
        }

        if (request.studioIds() != null && !request.studioIds().isEmpty()) {
            List<Studio> studios = studioRepository.findAllById(request.studioIds());
            anime.setStudios(new HashSet<>(studios));
        }

        anime = animeRepository.save(anime);

        if (Boolean.TRUE.equals(anime.getIsFeatured())) {
            redisTemplate.delete("anime:featured");
        }

        return animeMapper.toDetailDto(anime);
    }

    @Transactional
    public AnimeDetailDto updateAnime(Long id, UpdateAnimeRequest request) {
        Anime anime = animeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Anime not found", "ANIME", "ANIME_NOT_FOUND"));

        if (request.slug() != null && !request.slug().equals(anime.getSlug())) {
            if (animeRepository.existsBySlug(request.slug())) {
                throw new BusinessException("Slug already exists", "ANIME", "SLUG_ALREADY_EXISTS");
            }
            anime.setSlug(request.slug());
        }

        animeMapper.updateEntityFromRequest(request, anime);

        if (request.genreIds() != null) {
            List<Genre> genres = genreRepository.findAllById(request.genreIds());
            anime.getGenres().clear();
            anime.getGenres().addAll(genres);
        }

        if (request.studioIds() != null) {
            List<Studio> studios = studioRepository.findAllById(request.studioIds());
            anime.getStudios().clear();
            anime.getStudios().addAll(studios);
        }

        anime = animeRepository.save(anime);

        redisTemplate.delete("anime:" + id);
        redisTemplate.delete("anime:slug:" + anime.getSlug());
        redisTemplate.delete("anime:featured");

        return animeMapper.toDetailDto(anime);
    }

    @Transactional
    public void deleteAnime(Long id) {
        Anime anime = animeRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Anime not found", "ANIME", "ANIME_NOT_FOUND"));

        anime.setDeletedAt(LocalDateTime.now());
        animeRepository.save(anime);

        redisTemplate.delete("anime:" + id);
        redisTemplate.delete("anime:slug:" + anime.getSlug());
        redisTemplate.delete("anime:featured");
    }
}
