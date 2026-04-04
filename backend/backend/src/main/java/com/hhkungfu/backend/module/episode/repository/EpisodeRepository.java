package com.hhkungfu.backend.module.episode.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.episode.entity.Episode;
import com.hhkungfu.backend.module.video.enums.VideoStatus;

import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface EpisodeRepository extends JpaRepository<Episode, Long> {

    long countByDeletedAtIsNull();

    @Query("SELECT COALESCE(SUM(e.viewCount), 0) FROM Episode e WHERE e.deletedAt IS NULL")
    long sumViewCountNotDeleted();

    Optional<Episode> findByAnimeIdAndEpisodeNumberAndDeletedAtIsNull(Long animeId, Integer episodeNumber);

    Page<Episode> findByAnimeIdAndDeletedAtIsNull(Long animeId, Pageable pageable);

    @Query("SELECT MAX(e.episodeNumber) FROM Episode e WHERE e.anime.id = :animeId AND e.deletedAt IS NULL")
    Integer findMaxEpisodeNumberByAnimeId(@Param("animeId") Long animeId);

    @Transactional
    @Modifying
    @Query("UPDATE Episode e SET e.videoStatus = :status, e.hlsPath = :hlsPath, e.hlsBaseUrl = :hlsBaseUrl WHERE e.id = :id")
    void updateVideoReady(@Param("id") Long id, @Param("status") VideoStatus status, @Param("hlsPath") String hlsPath,
            @Param("hlsBaseUrl") String hlsBaseUrl);

    @Transactional
    @Modifying
    @Query("UPDATE Episode e SET e.videoStatus = :status WHERE e.id = :id")
    void updateVideoStatus(@Param("id") Long id, @Param("status") VideoStatus status);

    @Transactional
    @Modifying
    @Query("UPDATE Episode e SET e.viewCount = e.viewCount + :delta WHERE e.id = :id")
    void incrementViewCount(@Param("id") Long id, @Param("delta") Long delta);
}
