package com.hhkungfu.backend.module.video.repository;

import com.hhkungfu.backend.module.video.entity.VideoFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface VideoFileRepository extends JpaRepository<VideoFile, Long> {
    List<VideoFile> findByEpisodeId(Long episodeId);

    @Transactional
    @Modifying
    void deleteByEpisodeId(Long episodeId);
}
