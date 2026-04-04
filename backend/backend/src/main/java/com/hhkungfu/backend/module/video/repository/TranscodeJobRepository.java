package com.hhkungfu.backend.module.video.repository;

import com.hhkungfu.backend.module.video.entity.TranscodeJob;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TranscodeJobRepository extends JpaRepository<TranscodeJob, Long> {
    @Query("SELECT t FROM TranscodeJob t JOIN FETCH t.episode e JOIN FETCH e.anime a WHERE t.id = :id")
    Optional<TranscodeJob> findByIdWithEpisodeAndAnime(@Param("id") Long id);

    List<TranscodeJob> findByEpisodeIdOrderByCreatedAtDesc(Long episodeId);
    void deleteByEpisodeId(Long episodeId);

    long countByStatus(TranscodeJobStatus status);

    @Query("SELECT COUNT(t) FROM TranscodeJob t WHERE t.status = :status AND t.completedAt >= :since")
    long countByStatusAndCompletedAtAfter(@Param("status") TranscodeJobStatus status,
            @Param("since") LocalDateTime since);

    List<TranscodeJob> findByStatusOrderByCompletedAtDesc(TranscodeJobStatus status, Pageable pageable);

    @Query("SELECT t FROM TranscodeJob t JOIN FETCH t.episode e WHERE t.status = :status ORDER BY COALESCE(t.completedAt, t.createdAt) DESC")
    List<TranscodeJob> findRecentByStatusWithEpisode(@Param("status") TranscodeJobStatus status, Pageable pageable);

    @Query("SELECT t FROM TranscodeJob t JOIN FETCH t.episode e JOIN FETCH e.anime a WHERE t.status IN ('DONE','FAILED') ORDER BY COALESCE(t.completedAt, t.createdAt) DESC")
    List<TranscodeJob> findRecentForActivity(Pageable pageable);
}
