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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;

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

    private record VideoQuality(String name, int width, int height, int bitrate, String maxrate, String bufsize, String profile, String level, String codec) {}

    private static final List<VideoQuality> QUALITIES = List.of(
            new VideoQuality("360p", 640, 360, 800_000, "1000k", "2000k", "main", "3.0", "avc1.42e01e,mp4a.40.2"),
            new VideoQuality("720p", 1280, 720, 2_500_000, "2800k", "5600k", "main", "3.1", "avc1.4d401f,mp4a.40.2")
    );

    @Async("transcodeExecutor")
    public void runTranscode(Long jobId) {
        TranscodeJob job = transcodeJobRepository.findByIdWithEpisodeAndAnime(jobId).orElseThrow();

        if (job.getStatus() == TranscodeJobStatus.DONE) return; // Idempotency check

        String inputPath = job.getInputPath();
        String outputDir = System.getProperty("java.io.tmpdir") + "/hls/ep-" + job.getEpisode().getId();

        int maxRetries = 3;
        while (job.getRetryCount() < maxRetries) {
            try {
                job.setStatus(TranscodeJobStatus.RUNNING);
                job.setStartedAt(LocalDateTime.now());
                job.setErrorMessage(null);
                transcodeJobRepository.save(job);

                // Start from clean temp directory (Idempotency)
                safeDeleteDirectory(Path.of(outputDir));
                Files.createDirectories(Path.of(outputDir));

                // 1. Security: Validate before encoding
                validateInputFile(inputPath, job);

                // 2. Encode Qualities in Parallel (Multithreading)
                long totalBitrate = QUALITIES.stream().mapToLong(VideoQuality::bitrate).sum();
                AtomicInteger progressCounter = new AtomicInteger(10); // First 10% for validation

                job.setCurrentStep("Encoding video qualities in parallel...");
                transcodeJobRepository.save(job);

                List<CompletableFuture<Void>> futures = new ArrayList<>();
                for (var quality : QUALITIES) {
                    CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                        try {
                            runFfmpeg(inputPath, outputDir + "/" + quality.name(), quality);

                            // Update progress atomically
                            int weight = (int) (80 * quality.bitrate() / totalBitrate);
                            int currentProgress = progressCounter.addAndGet(weight);
                            
                            synchronized (job) {
                                job.setProgress((short) Math.min(90, currentProgress));
                                transcodeJobRepository.save(job);
                            }
                        } catch (IOException e) {
                            throw new RuntimeException("Lỗi IO khi encode " + quality.name(), e);
                        }
                    });
                    futures.add(future);
                }

                // Wait for all parallel tasks to finish. Throws CompletionException if any fails.
                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

                // 3. Generate Thumbnails (Sprite + VTT)
                job.setCurrentStep("Generating thumbnails...");
                transcodeJobRepository.save(job);
                long duration = (long) validateInputFile(inputPath, job); // Reuse validation to get duration
                generateThumbnails(inputPath, outputDir, duration);

                // 4. Create Master Playlist
                job.setCurrentStep("Generating playlists...");
                createMasterPlaylist(outputDir);

                // 4. Upload & Finalize
                String s3Key = "ep-" + job.getEpisode().getId();
                storageService.uploadDirectory(outputDir, s3Key);

                // 5. Save VideoFiles to DB (Optimized: No slow disk scanning)
                saveVideoFiles(job.getEpisode().getId(), outputDir, s3Key);

                // 6. Complete Episode & Job
                String apiBaseUrl = getApiBaseUrl();
                String masterUrl = apiBaseUrl + "/" + job.getEpisode().getId() + "/master.m3u8";
                episodeRepository.updateVideoReady(job.getEpisode().getId(), VideoStatus.READY, s3Key + "/master.m3u8",
                        masterUrl);
                animeRepository.touchUpdatedAt(job.getEpisode().getAnime().getId());

                job.setStatus(TranscodeJobStatus.DONE);
                job.setProgress((short) 100);
                job.setCurrentStep("Completed");
                job.setCompletedAt(LocalDateTime.now());
                transcodeJobRepository.save(job);

                log.info("[VideoTranscode] Job {} completed successfully after {} attempts", jobId, job.getRetryCount() + 1);
                return; // Break retry loop on success

            } catch (Exception e) {
                int currentAttempt = job.getRetryCount() + 1;
                job.setRetryCount(currentAttempt);
                log.error("[VideoTranscode] Attempt {} failed for job {}", currentAttempt, jobId, e);

                if (currentAttempt >= maxRetries) {
                    markJobFailed(job, e instanceof BusinessException ? e.getMessage() : "Quá trình xử lý video thất bại sau " + maxRetries + " lần thử.");
                    episodeRepository.updateVideoStatus(job.getEpisode().getId(), VideoStatus.FAILED);
                } else {
                    job.setCurrentStep("Retrying (Attempt " + (currentAttempt + 1) + ")...");
                    transcodeJobRepository.save(job);
                    // Small delay before retry
                    try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
                }
            } finally {
                // Security: Clean up input temp file only on final attempt or success
                if (job.getStatus() != TranscodeJobStatus.RUNNING) {
                    safeDelete(Path.of(inputPath));
                    safeDeleteDirectory(Path.of(outputDir));
                }
            }
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
    private double validateInputFile(String inputPath, TranscodeJob job) throws IOException {
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
        
        return format.duration;
    }

    private void generateThumbnails(String inputPath, String outputDir, long duration) throws IOException {
        Path thumbDir = Path.of(outputDir, "thumbnails");
        Files.createDirectories(thumbDir);

        FFmpeg ffmpeg = new FFmpeg(ffmpegPath);
        FFprobe ffprobe = new FFprobe(ffprobePath);

        // Config
        int interval = 10; // 10 seconds per thumb
        int columns = 10;
        int width = 160;
        int height = 90;

        int totalThumbs = (int) Math.max(1, duration / interval);
        int rows = (int) Math.ceil((double) totalThumbs / columns);

        // 1. Generate Sprite Image
        FFmpegBuilder builder = new FFmpegBuilder()
                .setInput(inputPath)
                .overrideOutputFiles(true)
                .addOutput(thumbDir.resolve("sprite.jpg").toString())
                .setFrames(1)
                .setVideoFilter("select='not(mod(t," + interval + "))',scale=" + width + ":" + height + ",tile=" + columns + "x" + rows)
                .done();

        new net.bramp.ffmpeg.FFmpegExecutor(ffmpeg, ffprobe).createJob(builder).run();

        // 2. Generate VTT file
        StringBuilder vtt = new StringBuilder("WEBVTT\n\n");
        for (int i = 0; i < totalThumbs; i++) {
            int startSec = i * interval;
            int endSec = Math.min((int) duration, (i + 1) * interval);
            
            int x = (i % columns) * width;
            int y = (i / columns) * height;

            vtt.append(formatVttTime(startSec)).append(" --> ").append(formatVttTime(endSec)).append("\n");
            vtt.append("sprite.jpg#xywh=").append(x).append(",").append(y).append(",").append(width).append(",").append(height).append("\n\n");
        }
        Files.writeString(thumbDir.resolve("thumbnails.vtt"), vtt.toString());
    }

    private String formatVttTime(int seconds) {
        int h = seconds / 3600;
        int m = (seconds % 3600) / 60;
        int s = seconds % 60;
        return String.format("%02d:%02d:%02d.000", h, m, s);
    }

    // ─────────────────────────────────────────────────────────────────
    // FFmpeg encode với metadata stripping
    // ─────────────────────────────────────────────────────────────────
    private void runFfmpeg(String inputPath, String outputDir, VideoQuality quality) throws IOException {
        Files.createDirectories(Path.of(outputDir));
        FFmpeg ffmpeg = new FFmpeg(ffmpegPath);
        FFprobe ffprobe = new FFprobe(ffprobePath);

        FFmpegBuilder builder = new FFmpegBuilder()
                .setInput(inputPath)
                .overrideOutputFiles(true)
                .addOutput(outputDir + "/index.m3u8")
                .setVideoCodec("libx264")
                .setVideoFilter("scale=" + quality.width() + ":" + quality.height())
                .setVideoBitRate(quality.bitrate())
                .setAudioCodec("aac")
                .setAudioBitRate(128_000)
                // Security: Strip ALL metadata (title, artist, comment, custom tags...)
                .addExtraArgs("-map_metadata", "-1")
                .addExtraArgs("-map_chapters", "-1")
                .addExtraArgs("-preset", "fast")
                .addExtraArgs("-crf", "23")
                // Bitrate capping (CRF + Maxrate)
                .addExtraArgs("-maxrate", quality.maxrate())
                .addExtraArgs("-bufsize", quality.bufsize())
                // Compatibility profile & level
                .addExtraArgs("-profile:v", quality.profile())
                .addExtraArgs("-level", quality.level())
                // Smoothness & ABR alignment
                .addExtraArgs("-g", "48")
                .addExtraArgs("-keyint_min", "48")
                .addExtraArgs("-sc_threshold", "0")
                .addExtraArgs("-threads", "2")
                // Playback speed
                .addExtraArgs("-movflags", "+faststart")
                // HLS settings
                .addExtraArgs("-hls_time", "10")
                .addExtraArgs("-hls_list_size", "0")
                .addExtraArgs("-hls_playlist_type", "vod")
                .addExtraArgs("-hls_segment_type", "fmp4")
                .addExtraArgs("-hls_fmp4_init_filename", "init.mp4")
                .addExtraArgs("-hls_segment_filename", outputDir + "/seg%03d.m4s")
                .done();

        net.bramp.ffmpeg.FFmpegExecutor executor = new net.bramp.ffmpeg.FFmpegExecutor(ffmpeg, ffprobe);
        FFmpegJob job = executor.createJob(builder);
        job.run();
        if (job.getState() == FFmpegJob.State.FAILED) {
            throw new RuntimeException("FFmpeg job failed for resolution " + quality.height() + "p");
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────
    private void createMasterPlaylist(String outputDir) throws IOException {
        StringBuilder content = new StringBuilder("#EXTM3U\n#EXT-X-VERSION:6\n");

        for (var q : QUALITIES) {
            content.append(String.format(
                    "#EXT-X-STREAM-INF:BANDWIDTH=%d,RESOLUTION=%dx%d,CODECS=\"%s\",FRAME-RATE=30\n",
                    q.bitrate(), q.width(), q.height(), q.codec()
            ));
            content.append(q.name()).append("/index.m3u8\n");
        }

        Files.writeString(Path.of(outputDir, "master.m3u8"), content.toString());
    }

    private void saveVideoFiles(Long episodeId, String localDir, String s3Key) throws IOException {
        videoFileRepository.deleteByEpisodeId(episodeId);

        var episode = episodeRepository.getReferenceById(episodeId);
        List<VideoFile> videoFiles = new ArrayList<>();

        // Optimized: Save explicit entry points only (no disk scanning)
        
        // 1. Master Playlist
        Path masterPath = Path.of(localDir, "master.m3u8");
        if (Files.exists(masterPath)) {
            videoFiles.add(VideoFile.builder()
                    .episode(episode)
                    .quality("master")
                    .filePath(s3Key + "/master.m3u8")
                    .fileType(FileType.PLAYLIST)
                    .fileName("master.m3u8")
                    .fileSize(Files.size(masterPath))
                    .build());
        }

        // 2. Individual Quality Playlists & Init segments
        for (var q : QUALITIES) {
            // Quality index (playlist)
            Path qPath = Path.of(localDir, q.name(), "index.m3u8");
            if (Files.exists(qPath)) {
                videoFiles.add(VideoFile.builder()
                        .episode(episode)
                        .quality(q.name())
                        .filePath(s3Key + "/" + q.name() + "/index.m3u8")
                        .fileType(FileType.PLAYLIST)
                        .fileName("index.m3u8")
                        .fileSize(Files.size(qPath))
                        .width(q.width())
                        .height(q.height())
                        .bitrate((long) q.bitrate())
                        .build());
            }

            // Init segment (required for fMP4 playback)
            Path initPath = Path.of(localDir, q.name(), "init.mp4");
            if (Files.exists(initPath)) {
                videoFiles.add(VideoFile.builder()
                        .episode(episode)
                        .quality(q.name())
                        .filePath(s3Key + "/" + q.name() + "/init.mp4")
                        .fileType(FileType.SEGMENT)
                        .fileName("init.mp4")
                        .fileSize(Files.size(initPath))
                        .width(q.width())
                        .height(q.height())
                        .bitrate((long) q.bitrate())
                        .build());
            }
        }

        // 3. Thumbnails (Sprite & VTT)
        Path spritePath = Path.of(localDir, "thumbnails", "sprite.jpg");
        if (Files.exists(spritePath)) {
            videoFiles.add(VideoFile.builder()
                    .episode(episode)
                    .quality("thumb")
                    .filePath(s3Key + "/thumbnails/sprite.jpg")
                    .fileType(FileType.SPRITE)
                    .fileName("sprite.jpg")
                    .fileSize(Files.size(spritePath))
                    .build());
        }

        Path vttPath = Path.of(localDir, "thumbnails", "thumbnails.vtt");
        if (Files.exists(vttPath)) {
            videoFiles.add(VideoFile.builder()
                    .episode(episode)
                    .quality("thumb")
                    .filePath(s3Key + "/thumbnails/thumbnails.vtt")
                    .fileType(FileType.VTT)
                    .fileName("thumbnails.vtt")
                    .fileSize(Files.size(vttPath))
                    .build());
        }

        if (!videoFiles.isEmpty()) {
            videoFileRepository.saveAll(videoFiles);
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
