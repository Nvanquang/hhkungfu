package com.hhkungfu.backend.module.interaction.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.interaction.dto.BookmarkDto;
import com.hhkungfu.backend.module.interaction.entity.Bookmark;
import com.hhkungfu.backend.module.interaction.entity.BookmarkId;
import com.hhkungfu.backend.module.interaction.repository.BookmarkRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final AnimeRepository animeRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Transactional
    public void addBookmark(String userIdStr, Long animeId) {
        UUID userId = UUID.fromString(userIdStr);

        if (!animeRepository.existsById(animeId)) {
            throw new ResourceNotFoundException("Anime không tồn tại", "ANIME",
                    ErrorConstants.ANIME_NOT_FOUND.getCode());
        }

        BookmarkId id = new BookmarkId(userId, animeId);
        if (bookmarkRepository.existsById(id)) {
            throw new BusinessException("Anime đã được bookmark", "BOOKMARK",
                    ErrorConstants.ALREADY_BOOKMARKED.getCode());
        }

        Bookmark bookmark = Bookmark.builder()
                .id(id)
                .build();

        bookmarkRepository.save(bookmark);

        // Evict cache
        clearUserBookmarkCache(userIdStr, animeId);
    }

    @Transactional
    public void removeBookmark(String userIdStr, Long animeId) {
        UUID userId = UUID.fromString(userIdStr);
        BookmarkId id = new BookmarkId(userId, animeId);

        if (!bookmarkRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bookmark không tồn tại", "BOOKMARK",
                    ErrorConstants.USER_NOT_FOUND.getCode()); // Or BOOKMARK_NOT_FOUND if defined
        }

        bookmarkRepository.deleteById(id);

        // Evict cache
        clearUserBookmarkCache(userIdStr, animeId);
    }

    @Transactional(readOnly = true)
    public boolean isBookmarked(String userIdStr, Long animeId) {
        String cacheKey = "user:" + userIdStr + ":bookmark:" + animeId;

        // Check cache
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return Boolean.parseBoolean(cached);
        }

        UUID userId = UUID.fromString(userIdStr);
        boolean exists = bookmarkRepository.existsByIdUserIdAndIdAnimeId(userId, animeId);

        // Save to cache (10 mins)
        redisTemplate.opsForValue().set(cacheKey, String.valueOf(exists), Duration.ofMinutes(10));

        return exists;
    }

    @Transactional(readOnly = true)
    public PageResponse<BookmarkDto> getMyBookmarks(String userIdStr, Pageable pageable) {
        String cacheKey = String.format("user:%s:bookmarks:page:%d:limit:%d",
                userIdStr, pageable.getPageNumber() + 1, pageable.getPageSize());

        // Check cache
        String cachedJson = redisTemplate.opsForValue().get(cacheKey);
        if (cachedJson != null) {
            try {
                return objectMapper.readValue(cachedJson,
                        objectMapper.getTypeFactory().constructParametricType(PageResponse.class, BookmarkDto.class));
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize bookmarks from cache: {}", cacheKey);
            }
        }

        UUID userId = UUID.fromString(userIdStr);
        Page<BookmarkDto> page = bookmarkRepository.findByUserId(userId, pageable);

        PageResponse<BookmarkDto> response = PageResponse.<BookmarkDto>builder()
                .items(page.getContent())
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(pageable.getPageNumber() + 1)
                        .limit(pageable.getPageSize())
                        .total(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .build())
                .build();

        // Save to cache (10 mins)
        try {
            redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(response),
                    Duration.ofMinutes(10));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize bookmarks response", e);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public java.util.Set<Long> getBookmarkedAnimeIds(String userIdStr) {
        UUID userId = UUID.fromString(userIdStr);
        return new java.util.HashSet<>(bookmarkRepository.findAnimeIdsByUserId(userId));
    }

    private void clearUserBookmarkCache(String userId, Long animeId) {
        // Delete status cache
        redisTemplate.delete("user:" + userId + ":bookmark:" + animeId);

        // Delete list cache (all pages)
        Set<String> keys = redisTemplate.keys("user:" + userId + ":bookmarks:page:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
