package com.hhkungfu.backend.module.video.service;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.util.VideoUtils;
import com.hhkungfu.backend.module.episode.entity.Episode;
import com.hhkungfu.backend.module.episode.repository.EpisodeRepository;
import com.hhkungfu.backend.module.video.entity.TranscodeJob;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;
import com.hhkungfu.backend.module.video.enums.VideoStatus;
import com.hhkungfu.backend.module.video.repository.TranscodeJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoUploadService {

    private final EpisodeRepository episodeRepository;
    private final TranscodeJobRepository transcodeJobRepository;
    private final VideoTranscodeService videoTranscodeService;

    @Transactional
    public Long initiateUpload(Long episodeId, MultipartFile file) {
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new BusinessException("Tập phim không tồn tại", "EPISODE",
                        ErrorConstants.EPISODE_NOT_FOUND.getCode()));

        if (episode.getVideoStatus() == VideoStatus.PROCESSING) {
            throw new BusinessException("Video đang được xử lý", "VIDEO",
                    ErrorConstants.VIDEO_ALREADY_PROCESSING.getCode());
        }

        try {
            String tempFileName = UUID.randomUUID() + ".mp4";
            Path tempFilePath = Path.of(System.getProperty("java.io.tmpdir"), "uploads", tempFileName);
            Files.createDirectories(tempFilePath.getParent());
            file.transferTo(tempFilePath);

            TranscodeJob job = TranscodeJob.builder()
                    .episode(episode)
                    .inputPath(tempFilePath.toString())
                    .status(TranscodeJobStatus.QUEUED)
                    .build();
            TranscodeJob savedJob = transcodeJobRepository.save(job);
            final Long finalJobId = savedJob.getId();

            episode.setVideoStatus(VideoStatus.PROCESSING);
            episode.setDurationSeconds(VideoUtils.getVideoDuration(file));
            episode.setFileSizeBytes(file.getSize());
            episodeRepository.save(episode);

            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                TransactionSynchronizationManager.registerSynchronization(
                        new TransactionSynchronization() {
                            @Override
                            public void afterCommit() {
                                videoTranscodeService.runTranscode(finalJobId);
                            }
                        });
            } else {
                videoTranscodeService.runTranscode(finalJobId);
            }

            return finalJobId;
        } catch (IOException e) {
            throw new BusinessException("Không thể tải lên file", "VIDEO", ErrorConstants.UPLOAD_FAILED.getCode());
        }
    }
}
