package com.hhkungfu.backend.module.video.service;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.infrastructure.storage.StorageService;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.episode.repository.EpisodeRepository;
import com.hhkungfu.backend.module.video.entity.TranscodeJob;
import com.hhkungfu.backend.module.video.entity.VideoFile;
import com.hhkungfu.backend.module.video.enums.FileType;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;
import com.hhkungfu.backend.module.video.enums.VideoStatus;
import com.hhkungfu.backend.module.video.repository.TranscodeJobRepository;
import com.hhkungfu.backend.module.video.repository.VideoFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.bramp.ffmpeg.FFmpeg;
import net.bramp.ffmpeg.FFprobe;
import net.bramp.ffmpeg.builder.FFmpegBuilder;
import net.bramp.ffmpeg.job.FFmpegJob;
import net.bramp.ffmpeg.probe.FFmpegProbeResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoTranscodeService {

    private final TranscodeJobRepository transcodeJobRepository;
    private final EpisodeRepository episodeRepository;
    private final AnimeRepository animeRepository;
    private final VideoFileRepository videoFileRepository;
    private final StorageService storageService;

    @Value("${ffmpeg.path}")
    private String ffmpegPath;

    @Value("${ffprobe.path}")
    private String ffprobePath;

    @Value("${app.api.base-url:http://localhost:8080}")
    private String apiBaseUrl;

    // Limits
    private static final double MAX_DURATION_SECONDS = 10_800; // 3 giờ
    private static final long MAX_BITRATE_BPS = 100_000_000L;  // 100 Mbps
    private static final int MAX_STREAMS = 5;

    @Async("transcodeExecutor")
    public void runTranscode(Long jobId) {
        TranscodeJob job = transcodeJobRepository.findByIdWithEpisodeAndAnime(jobId).orElseThrow();

        String inputPath = job.getInputPath();
        String outputDir = System.getProperty("java.io.tmpdir") + "/hls/ep-" + job.getEpisode().getId();

        try {
            job.setStatus(TranscodeJobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
            transcodeJobRepository.save(job);

            Files.createDirectories(Path.of(outputDir));

            // Security: Validate duration, bitrate, streams TRƯỚC khi encode
            validateInputFile(inputPath, job);

            // Encode 360p
            job.setCurrentStep("Encoding 360p...");
            transcodeJobRepository.save(job);
            runFfmpeg(inputPath, outputDir + "/360p", 640, 360, 800_000);
            job.setProgress((short) 50);
            transcodeJobRepository.save(job);

            // Encode 720p
            job.setCurrentStep("Encoding 720p...");
            transcodeJobRepository.save(job);
            runFfmpeg(inputPath, outputDir + "/720p", 1280, 720, 2_500_000);
            job.setProgress((short) 90);
            transcodeJobRepository.save(job);

            // Master Playlist
            createMasterPlaylist(outputDir);

            // Upload
            String s3Key = "ep-" + job.getEpisode().getId();
            storageService.uploadDirectory(outputDir, s3Key);

            // Save VideoFiles to DB
            saveVideoFiles(job.getEpisode().getId(), outputDir, s3Key);

            // Update Episode
            String apiBaseUrl = getApiBaseUrl();
            String masterUrl = apiBaseUrl + "/" + job.getEpisode().getId() + "/master.m3u8";
            episodeRepository.updateVideoReady(job.getEpisode().getId(), VideoStatus.READY, s3Key + "/master.m3u8",
                    masterUrl);

            // Update Anime updatedAt
            animeRepository.touchUpdatedAt(job.getEpisode().getAnime().getId());

            // Done
            job.setStatus(TranscodeJobStatus.DONE);
            job.setProgress((short) 100);
            job.setCurrentStep("Completed");
            job.setCompletedAt(LocalDateTime.now());
            transcodeJobRepository.save(job);

        } catch (BusinessException e) {
            // Validation error — log + thông báo cụ thể
            log.warn("[VideoSecurity] Validation thất bại cho job {}: {}", jobId, e.getMessage());
            markJobFailed(job, "File không hợp lệ: " + e.getMessage());
            episodeRepository.updateVideoStatus(job.getEpisode().getId(), VideoStatus.FAILED);
        } catch (Exception e) {
            // Security: Không lộ internal error ra message
            log.error("Transcode failed for job {}", jobId, e);
            markJobFailed(job, "Quá trình xử lý video thất bại. Vui lòng thử lại.");
            episodeRepository.updateVideoStatus(job.getEpisode().getId(), VideoStatus.FAILED);
        } finally {
            // Security: Luôn xóa temp files kể cả khi fail
            safeDelete(Path.of(inputPath));
            safeDeleteDirectory(Path.of(outputDir));
        }
    }

    public void retranscode(Long jobId) {
        TranscodeJob job = transcodeJobRepository.findById(jobId).orElseThrow();
        job.setStatus(TranscodeJobStatus.QUEUED);
        job.setErrorMessage(null);
        job.setProgress((short) 0);
        job.setCurrentStep("Re-queued for retry");
        job.setStartedAt(null);
        job.setCompletedAt(null);
        transcodeJobRepository.save(job);
        runTranscode(jobId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Validation trước transcode
    // ─────────────────────────────────────────────────────────────────
    private void validateInputFile(String inputPath, TranscodeJob job) throws IOException {
        FFprobe ffprobe = new FFprobe(ffprobePath);
        FFmpegProbeResult probeResult;

        try {
            probeResult = ffprobe.probe(inputPath);
        } catch (Exception e) {
            log.warn("[VideoSecurity] FFprobe không thể đọc file: {}", inputPath);
            throw new BusinessException("File bị hỏng hoặc không đọc được", "VIDEO",
                    ErrorConstants.VIDEO_MALFORMED.getCode());
        }

        var format = probeResult.getFormat();
        if (format == null) {
            throw new BusinessException("File không có format hợp lệ", "VIDEO",
                    ErrorConstants.VIDEO_MALFORMED.getCode());
        }

        // Duration check
        if (format.duration > MAX_DURATION_SECONDS) {
            log.warn("[VideoSecurity] Video quá dài: {} giây (job={})", format.duration, job.getId());
            throw new BusinessException(
                    "Video quá dài. Tối đa 3 giờ (" + (int)(format.duration / 60) + " phút bị từ chối)",
                    "VIDEO", ErrorConstants.VIDEO_TOO_LONG.getCode());
        }

        // Bitrate check
        if (format.bit_rate > MAX_BITRATE_BPS) {
            log.warn("[VideoSecurity] Bitrate quá cao: {} bps (job={})", format.bit_rate, job.getId());
            throw new BusinessException(
                    "Bitrate video quá cao. Tối đa 100 Mbps",
                    "VIDEO", ErrorConstants.VIDEO_BITRATE_TOO_HIGH.getCode());
        }

        // Stream count check
        var streams = probeResult.getStreams();
        if (streams != null && streams.size() > MAX_STREAMS) {
            log.warn("[VideoSecurity] Quá nhiều streams: {} (job={})", streams.size(), job.getId());
            throw new BusinessException(
                    "File chứa quá nhiều stream (tối đa " + MAX_STREAMS + ")",
                    "VIDEO", ErrorConstants.VIDEO_TOO_MANY_STREAMS.getCode());
        }

        log.info("[VideoTranscode] Input validated: duration={}s, bitrate={}bps, streams={}",
                (int) format.duration, format.bit_rate, streams != null ? streams.size() : 0);
    }

    // ─────────────────────────────────────────────────────────────────
    // FFmpeg encode với metadata stripping
    // ─────────────────────────────────────────────────────────────────
    private void runFfmpeg(String inputPath, String outputDir, int width, int height, int bitrate) throws IOException {
        Files.createDirectories(Path.of(outputDir));
        FFmpeg ffmpeg = new FFmpeg(ffmpegPath);
        FFprobe ffprobe = new FFprobe(ffprobePath);

        FFmpegBuilder builder = new FFmpegBuilder()
                .setInput(inputPath)
                .overrideOutputFiles(true)
                .addOutput(outputDir + "/index.m3u8")
                .setVideoCodec("libx264")
                .setVideoFilter("scale=" + width + ":" + height)
                .setVideoBitRate(bitrate)
                .setAudioCodec("aac")
                .setAudioBitRate(128_000)
                // Security: Strip ALL metadata (title, artist, comment, custom tags...)
                .addExtraArgs("-map_metadata", "-1")
                .addExtraArgs("-map_chapters", "-1")
                .addExtraArgs("-hls_time", "10")
                .addExtraArgs("-hls_list_size", "0")
                .addExtraArgs("-hls_segment_type", "mpegts")
                .addExtraArgs("-hls_segment_filename", outputDir + "/seg%03d.ts")
                .done();

        net.bramp.ffmpeg.FFmpegExecutor executor = new net.bramp.ffmpeg.FFmpegExecutor(ffmpeg, ffprobe);
        FFmpegJob job = executor.createJob(builder);
        job.run();
        if (job.getState() == FFmpegJob.State.FAILED) {
            throw new RuntimeException("FFmpeg job failed for resolution " + height + "p");
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────
    private void createMasterPlaylist(String outputDir) throws IOException {
        String content = "#EXTM3U\n" +
                "#EXT-X-VERSION:3\n" +
                "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n" +
                "360p/index.m3u8\n" +
                "#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720\n" +
                "720p/index.m3u8\n";
        Files.writeString(Path.of(outputDir, "master.m3u8"), content);
    }

    private void saveVideoFiles(Long episodeId, String localDir, String s3Key) throws IOException {
        videoFileRepository.deleteByEpisodeId(episodeId);

        try (java.util.stream.Stream<Path> stream = Files.walk(Path.of(localDir))) {
            stream.filter(Files::isRegularFile)
                    .forEach(file -> {
                        String fileName = file.getFileName().toString();
                        String relativePath = Path.of(localDir).relativize(file).toString().replace("\\", "/");
                        String quality = relativePath.contains("360p") ? "360p"
                                : (relativePath.contains("720p") ? "720p" : "master");
                        FileType type = fileName.endsWith(".m3u8") ? FileType.PLAYLIST : FileType.SEGMENT;

                        try {
                            VideoFile vf = VideoFile.builder()
                                    .episode(episodeRepository.getReferenceById(episodeId))
                                    .quality(quality)
                                    .filePath(s3Key + "/" + relativePath)
                                    .fileType(type)
                                    .fileName(fileName)
                                    .fileSize(Files.size(file))
                                    .build();
                            videoFileRepository.save(vf);
                        } catch (IOException e) {
                            log.error("Failed to read file size", e);
                        }
                    });
        }
    }

    private void markJobFailed(TranscodeJob job, String genericMessage) {
        job.setStatus(TranscodeJobStatus.FAILED);
        job.setErrorMessage(genericMessage); // Không lộ stack trace
        job.setCompletedAt(LocalDateTime.now());
        transcodeJobRepository.save(job);
    }

    private void safeDelete(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Không thể xóa temp file: {}", path, e);
        }
    }

    private void safeDeleteDirectory(Path path) {
        try {
            if (Files.exists(path)) {
                try (java.util.stream.Stream<Path> walk = Files.walk(path)) {
                    walk.sorted(java.util.Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(java.io.File::delete);
                }
            }
        } catch (IOException e) {
            log.warn("Không thể xóa temp directory: {}", path, e);
        }
    }

    // Helper method to get API base URL for HLS endpoints
    private String getApiBaseUrl() {
        return apiBaseUrl + "/api/v1/files/hls";
    }
}
