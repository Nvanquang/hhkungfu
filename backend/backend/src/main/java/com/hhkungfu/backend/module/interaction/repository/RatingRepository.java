package com.hhkungfu.backend.module.interaction.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.interaction.entity.Rating;
import com.hhkungfu.backend.module.interaction.entity.RatingId;

import java.util.List;
import java.util.Map;

@Repository
public interface RatingRepository extends JpaRepository<Rating, RatingId> {

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.id.animeId = :animeId")
    Double getAverageScore(@Param("animeId") Long animeId);

    @Query("SELECT r.score as score, COUNT(r) as count FROM Rating r WHERE r.id.animeId = :animeId GROUP BY r.score")
    List<Map<String, Object>> getScoreDistribution(@Param("animeId") Long animeId);
}
