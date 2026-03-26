package com.hhkungfu.backend.module.episode.repository;

import com.hhkungfu.backend.module.episode.entity.Subtitle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubtitleRepository extends JpaRepository<Subtitle, Long> {
    List<Subtitle> findByEpisodeId(Long episodeId);
}
