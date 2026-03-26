package com.hhkungfu.backend.module.video.controller;

import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.module.video.dto.TranscodeProgressDto;
import com.hhkungfu.backend.module.video.entity.TranscodeJob;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;
import com.hhkungfu.backend.module.video.repository.TranscodeJobRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Video Progress", description = "Transcode progress SSE and polling APIs")
public class VideoProgressController {

    private final TranscodeJobRepository transcodeJobRepository;

    // ── SSE ──────────────────────────────────────────────────────────────────

    @GetMapping(value = "/transcode/{jobId}/progress", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "SSE stream for transcode progress (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter streamProgress(@PathVariable(name = "jobId") Long jobId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout

        var scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> {
            try {
                TranscodeJob job = transcodeJobRepository.findById(jobId).orElseThrow();
                TranscodeProgressDto payload = toProgressDto(job);

                if (job.getStatus() == TranscodeJobStatus.DONE || job.getStatus() == TranscodeJobStatus.FAILED) {
                    String eventName = job.getStatus() == TranscodeJobStatus.DONE ? "done" : "error";
                    emitter.send(SseEmitter.event().name(eventName).data(payload));
                    emitter.complete();
                    scheduler.shutdown();
                    return;
                }
                emitter.send(SseEmitter.event().name("progress").data(payload));
            } catch (Exception e) {
                emitter.completeWithError(e);
                scheduler.shutdown();
            }
        }, 0, 2, TimeUnit.SECONDS);

        emitter.onCompletion(scheduler::shutdown);
        emitter.onTimeout(scheduler::shutdown);

        return emitter;
    }

    // ── Polling fallback ──────────────────────────────────────────────────────

    @GetMapping("/transcode/{jobId}")
    @Operation(summary = "Poll transcode job status (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TranscodeProgressDto> getJobStatus(@PathVariable(name = "jobId") Long jobId) {
        TranscodeJob job = transcodeJobRepository.findById(jobId)
                .orElseThrow(() -> new com.hhkungfu.backend.common.exception.ResourceNotFoundException(
                        "Không tìm thấy job transcode", "VIDEO", ErrorConstants.TRANSCODE_JOB_NOT_FOUND.getCode()));
        return ResponseEntity.ok(toProgressDto(job));
    }

    @GetMapping("/episodes/{episodeId}/transcode-history")
    @Operation(summary = "Get transcode history for an episode (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TranscodeProgressDto>> getTranscodeHistory(
            @PathVariable(name = "episodeId") Long episodeId) {
        List<TranscodeProgressDto> history = transcodeJobRepository
                .findByEpisodeIdOrderByCreatedAtDesc(episodeId)
                .stream()
                .map(this::toProgressDto)
                .toList();
        return ResponseEntity.ok(history);
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private TranscodeProgressDto toProgressDto(TranscodeJob job) {
        return TranscodeProgressDto.builder()
                .jobId(job.getId())
                .status(job.getStatus())
                .progress(job.getProgress() != null ? (int) job.getProgress() : 0)
                .currentStep(job.getCurrentStep())
                .error(job.getErrorMessage())
                .build();
    }
}
