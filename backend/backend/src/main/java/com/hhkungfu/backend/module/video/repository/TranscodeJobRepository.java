package com.hhkungfu.backend.module.video.repository;

import com.hhkungfu.backend.module.video.entity.TranscodeJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TranscodeJobRepository extends JpaRepository<TranscodeJob, Long> {
    List<TranscodeJob> findByEpisodeIdOrderByCreatedAtDesc(Long episodeId);
    void deleteByEpisodeId(Long episodeId);
}
