package com.hhkungfu.backend.module.video.service;

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

    @org.springframework.beans.factory.annotation.Value("${ffmpeg.path}")
    private String ffmpegPath;

    @org.springframework.beans.factory.annotation.Value("${ffprobe.path}")
    private String ffprobePath;

    @Async("transcodeExecutor")
    public void runTranscode(Long jobId) {
        TranscodeJob job = transcodeJobRepository.findByIdWithEpisodeAndAnime(jobId).orElseThrow();

        try {
            job.setStatus(TranscodeJobStatus.RUNNING);
            job.setStartedAt(LocalDateTime.now());
            transcodeJobRepository.save(job);

            String inputPath = job.getInputPath();
            String outputDir = System.getProperty("java.io.tmpdir") + "/hls/ep-" + job.getEpisode().getId();
            Files.createDirectories(Path.of(outputDir));

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
            String masterUrl = storageService.getBaseUrl() + "/" + job.getEpisode().getId() + "/master.m3u8";
            episodeRepository.updateVideoReady(job.getEpisode().getId(), VideoStatus.READY, s3Key + "/master.m3u8",
                    masterUrl);

            // Update Anime updatedAt using optimized query
            animeRepository.touchUpdatedAt(job.getEpisode().getAnime().getId());

            // Done
            job.setStatus(TranscodeJobStatus.DONE);
            job.setProgress((short) 100);
            job.setCurrentStep("Completed");
            job.setCompletedAt(LocalDateTime.now());
            transcodeJobRepository.save(job);

            // Cleanup local
            Files.deleteIfExists(Path.of(inputPath));
            deleteLocalDirectory(Path.of(outputDir));

        } catch (Exception e) {
            log.error("Transcode failed for job {}", jobId, e);
            job.setStatus(TranscodeJobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(LocalDateTime.now());
            transcodeJobRepository.save(job);
            episodeRepository.updateVideoStatus(job.getEpisode().getId(), VideoStatus.FAILED);
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

        // This calls the @Async runTranscode method
        runTranscode(jobId);
    }

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

    private void deleteLocalDirectory(Path path) throws IOException {
        if (Files.exists(path)) {
            try (java.util.stream.Stream<Path> walk = Files.walk(path)) {
                walk.sorted(java.util.Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(java.io.File::delete);
            }
        }
    }
}
