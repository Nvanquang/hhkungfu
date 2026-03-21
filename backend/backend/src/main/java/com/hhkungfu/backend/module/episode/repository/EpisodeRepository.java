package com.hhkungfu.backend.module.episode.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.episode.entity.Episode;

@Repository
public interface EpisodeRepository extends JpaRepository<Episode, Long> {
}
