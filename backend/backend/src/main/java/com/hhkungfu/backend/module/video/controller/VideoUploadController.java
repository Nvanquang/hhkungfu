package com.hhkungfu.backend.module.video.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;
import com.hhkungfu.backend.module.video.service.VideoUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/episodes")
@RequiredArgsConstructor
@Tag(name = "Video Upload", description = "Admin video upload APIs")
public class VideoUploadController {

    private final VideoUploadService videoUploadService;

    @PostMapping(value = "/{episodeId}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ApiMessage("Video upload initiated")
    @Operation(summary = "Upload and transcode a video file (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> uploadVideo(
            @PathVariable Long episodeId,
            @Parameter(description = "Video file to upload", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE, schema = @Schema(type = "string", format = "binary"))) @RequestParam("file") MultipartFile file) {

        log.info("REST request to upload video for episode {}", episodeId);

        Long jobId = videoUploadService.initiateUpload(episodeId, file);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "episodeId", episodeId,
                "jobId", jobId,
                "status", TranscodeJobStatus.QUEUED,
                "message", "Video đã được tiếp nhận, đang xếp hàng transcode"));
    }
}
