package com.hhkungfu.backend.module.user.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.user.dto.WatchHistoryDto;
import com.hhkungfu.backend.module.user.entity.WatchHistory;
import com.hhkungfu.backend.module.user.entity.WatchHistoryId;

import java.util.List;
import java.util.UUID;

@Repository
public interface WatchHistoryRepository extends JpaRepository<WatchHistory, WatchHistoryId> {
    
    long countByIdUserIdAndIsCompletedTrue(UUID userId);

    @Query("SELECT new com.hhkungfu.backend.module.user.dto.WatchHistoryDto(" +
           "e.anime.id, e.anime.title, e.anime.slug, e.anime.thumbnailUrl, e.id, e.episodeNumber, e.title, e.anime.episodeDuration, wh.progressSeconds, wh.watchedAt, wh.isCompleted) " +
           "FROM WatchHistory wh " +
           "JOIN Episode e ON wh.id.episodeId = e.id " +
           "WHERE wh.id.userId = :userId " +
           "AND wh.watchedAt = (SELECT MAX(wh2.watchedAt) FROM WatchHistory wh2 " +
           "                    JOIN Episode e2 ON wh2.id.episodeId = e2.id " +
           "                    WHERE wh2.id.userId = :userId AND e2.anime.id = e.anime.id) " +
           "ORDER BY wh.watchedAt DESC")
    Page<WatchHistoryDto> findLatestGroupByAnime(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT wh FROM WatchHistory wh " +
           "JOIN Episode e ON wh.id.episodeId = e.id " +
           "WHERE wh.id.userId = :userId AND e.anime.id = :animeId " +
           "ORDER BY wh.watchedAt DESC")
    List<WatchHistory> findByUserIdAndAnimeId(@Param("userId") UUID userId, @Param("animeId") Long animeId);

    void deleteByIdUserId(UUID userId);
}
