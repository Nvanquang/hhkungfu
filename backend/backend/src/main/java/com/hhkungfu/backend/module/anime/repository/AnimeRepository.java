package com.hhkungfu.backend.module.anime.repository;

import com.hhkungfu.backend.module.anime.entity.Anime;
import com.hhkungfu.backend.module.anime.repository.projection.AnimeRecentUpdateProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnimeRepository extends JpaRepository<Anime, Long>, JpaSpecificationExecutor<Anime> {

  @Query("SELECT a FROM Anime a LEFT JOIN FETCH a.genres LEFT JOIN FETCH a.studios WHERE a.slug = :slug AND a.deletedAt IS NULL")
  Optional<Anime> findBySlugAndDeletedAtIsNull(@Param("slug") String slug);

  @Query("SELECT a FROM Anime a LEFT JOIN FETCH a.genres LEFT JOIN FETCH a.studios WHERE a.id = :id AND a.deletedAt IS NULL")
  Optional<Anime> findByIdAndDeletedAtIsNull(@Param("id") Long id);

  boolean existsBySlug(String slug);

  @Query("SELECT a FROM Anime a WHERE a.isFeatured = true AND a.deletedAt IS NULL ORDER BY a.updatedAt DESC LIMIT :limit")
  List<Anime> findFeaturedAnimes(@Param("limit") int limit);

  @Query(value = """
      SELECT a.*, latest_ep.max_episode as latest_ep
      FROM animes a
      JOIN (
          SELECT anime_id, MAX(created_at) as max_created_at, MAX(episode_number) as max_episode
          FROM episodes
          WHERE deleted_at IS NULL
            AND video_status = 'READY'
            AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' -- Lọc trong 7 ngày
          GROUP BY anime_id
      ) latest_ep ON latest_ep.anime_id = a.id
      WHERE a.deleted_at IS NULL
      ORDER BY latest_ep.max_created_at DESC
      """, nativeQuery = true)
  Page<AnimeRecentUpdateProjection> findRecentlyUpdated(Pageable pageable);

  @Query(value = """
      SELECT a.* FROM animes a
      JOIN anime_genres ag ON ag.anime_id = a.id
      WHERE ag.genre_id IN (SELECT genre_id FROM anime_genres WHERE anime_id = :animeId)
        AND a.id != :animeId AND a.deleted_at IS NULL
      GROUP BY a.id
      ORDER BY a.view_count DESC
      """, nativeQuery = true)
  Page<Anime> findRelatedAnimes(@Param("animeId") Long animeId, Pageable pageable);

  @Modifying
  @Query("UPDATE Anime a SET a.updatedAt = CURRENT_TIMESTAMP WHERE a.id = :id")
  void touchUpdatedAt(@Param("id") Long id);
}
