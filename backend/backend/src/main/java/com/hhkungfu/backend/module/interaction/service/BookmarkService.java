package com.hhkungfu.backend.module.interaction.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.ConflictException;
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
            throw new ConflictException("Anime đã được bookmark",
                    ErrorConstants.ALREADY_BOOKMARKED.getCode());
        }

        Bookmark bookmark = Bookmark.builder()
                .id(id)
                .build();

        bookmarkRepository.save(bookmark);

        // Update cache instantly
        String setKey = "user:" + userIdStr + ":bookmarked_ids";
        redisTemplate.opsForSet().add(setKey, animeId.toString());
        redisTemplate.expire(setKey, Duration.ofDays(7)); // TTL for the set

        // Individual status cache
        redisTemplate.opsForValue().set("user:" + userIdStr + ":bookmark:" + animeId, "true", Duration.ofMinutes(10));

        // Clear list pages (too complex to update JSON)
        clearUserBookmarkListPageCache(userIdStr);
    }

    @Transactional
    public void removeBookmark(String userIdStr, Long animeId) {
        UUID userId = UUID.fromString(userIdStr);
        BookmarkId id = new BookmarkId(userId, animeId);

        if (!bookmarkRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bookmark không tồn tại", "BOOKMARK",
                    ErrorConstants.BOOKMARK_NOT_FOUND.getCode());
        }

        bookmarkRepository.deleteById(id);

        // Update cache instantly
        String setKey = "user:" + userIdStr + ":bookmarked_ids";
        redisTemplate.opsForSet().remove(setKey, animeId.toString());

        // Individual status cache
        redisTemplate.opsForValue().set("user:" + userIdStr + ":bookmark:" + animeId, "false", Duration.ofMinutes(10));

        // Clear list pages
        clearUserBookmarkListPageCache(userIdStr);
    }

    @Transactional(readOnly = true)
    public boolean isBookmarked(String userIdStr, Long animeId) {
        // 1. Check set cache first
        String setKey = "user:" + userIdStr + ":bookmarked_ids";
        Boolean isMember = redisTemplate.opsForSet().isMember(setKey, animeId.toString());
        if (isMember != null && Boolean.TRUE.equals(isMember)) {
            return true;
        }

        // 2. Check individual key (or fallback to DB)
        String cacheKey = "user:" + userIdStr + ":bookmark:" + animeId;
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return Boolean.parseBoolean(cached);
        }

        UUID userId = UUID.fromString(userIdStr);
        boolean exists = bookmarkRepository.existsByIdUserIdAndIdAnimeId(userId, animeId);

        // 3. Update cache
        redisTemplate.opsForValue().set(cacheKey, String.valueOf(exists), Duration.ofMinutes(10));
        if (exists) {
            redisTemplate.opsForSet().add(setKey, animeId.toString());
        }

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
        String setKey = "user:" + userIdStr + ":bookmarked_ids";
        Set<String> members = redisTemplate.opsForSet().members(setKey);

        if (members != null && !members.isEmpty()) {
            return members.stream().map(Long::valueOf).collect(java.util.stream.Collectors.toSet());
        }

        // Fallback to DB
        UUID userId = UUID.fromString(userIdStr);
        java.util.List<Long> ids = bookmarkRepository.findAnimeIdsByUserId(userId);
        java.util.Set<Long> idSet = new java.util.HashSet<>(ids);

        // Warm up cache
        if (!idSet.isEmpty()) {
            String[] idStrings = idSet.stream().map(String::valueOf).toArray(String[]::new);
            redisTemplate.opsForSet().add(setKey, idStrings);
            redisTemplate.expire(setKey, Duration.ofDays(7));
        } else {
            // Add a sentinel value if needed to avoid repeated DB calls for users with 0 bookmarks
            // For now, just return empty
        }

        return idSet;
    }

    private void clearUserBookmarkListPageCache(String userId) {
        // Delete list cache (all pages)
        Set<String> keys = redisTemplate.keys("user:" + userId + ":bookmarks:page:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
