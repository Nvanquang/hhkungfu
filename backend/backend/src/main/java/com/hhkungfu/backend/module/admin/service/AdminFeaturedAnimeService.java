package com.hhkungfu.backend.module.admin.service;

import com.hhkungfu.backend.common.constant.RedisKeys;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.admin.dto.request.PatchAnimeFeaturedRequest;
import com.hhkungfu.backend.module.anime.entity.Anime;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminFeaturedAnimeService {

    private final AnimeRepository animeRepository;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public void updateFeatured(Long animeId, PatchAnimeFeaturedRequest request) {
        Anime anime = animeRepository.findByIdAndDeletedAtIsNull(animeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy anime", "ANIME",
                        ErrorConstants.ANIME_NOT_FOUND.getCode()));

        anime.setIsFeatured(request.isFeatured());
        animeRepository.save(anime);

        redisTemplate.delete(RedisKeys.animeFeatured());
        redisTemplate.delete(RedisKeys.anime(anime.getId()));
        if (anime.getSlug() != null) {
            redisTemplate.delete(RedisKeys.animeSlug(anime.getSlug()));
        }
    }
}
