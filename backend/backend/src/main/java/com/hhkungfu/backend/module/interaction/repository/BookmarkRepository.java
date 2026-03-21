package com.hhkungfu.backend.module.interaction.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.interaction.dto.BookmarkDto;
import com.hhkungfu.backend.module.interaction.entity.Bookmark;
import com.hhkungfu.backend.module.interaction.entity.BookmarkId;

import java.util.UUID;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, BookmarkId> {

    long countByIdUserId(UUID userId);

    @Query("SELECT new com.hhkungfu.backend.module.interaction.dto.BookmarkDto(" +
            "a.id, a.title, a.slug, a.thumbnailUrl, a.malScore, a.status, a.type, " +
            "a.totalEpisodes, a.year, a.hasVipContent, b.createdAt) " +
            "FROM Bookmark b " +
            "JOIN Anime a ON b.id.animeId = a.id " +
            "WHERE b.id.userId = :userId " +
            "ORDER BY b.createdAt DESC")
    Page<BookmarkDto> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT b.id.animeId FROM Bookmark b WHERE b.id.userId = :userId")
    java.util.List<Long> findAnimeIdsByUserId(@Param("userId") UUID userId);

    boolean existsByIdUserIdAndIdAnimeId(UUID userId, Long animeId);
}
