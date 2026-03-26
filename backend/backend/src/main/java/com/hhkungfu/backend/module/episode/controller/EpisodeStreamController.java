package com.hhkungfu.backend.module.episode.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.video.dto.StreamInfoDto;
import com.hhkungfu.backend.module.episode.service.EpisodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/episodes")
@RequiredArgsConstructor
@Tag(name = "Episode Stream", description = "HLS stream and view-count APIs")
public class EpisodeStreamController {

    private final EpisodeService episodeService;

    @GetMapping("/{id}/stream-info")
    @ApiMessage("Stream info retrieved successfully")
    @Operation(summary = "Get HLS stream info (with VIP check)")
    public ResponseEntity<StreamInfoDto> getStreamInfo(@PathVariable(name = "id") Long id) {
        log.info("REST request to get stream-info for episode {}", id);
        UUID userId = SecurityUtil.getCurrentUserId().map(UUID::fromString).orElse(null);
        return ResponseEntity.ok(episodeService.getStreamInfo(id, userId));
    }

    @PostMapping("/{id}/view")
    @Operation(summary = "Increment view count (no auth)")
    public ResponseEntity<Void> incrementView(@PathVariable(name = "id") Long id) {
        episodeService.incrementView(id);
        return ResponseEntity.noContent().build();
    }
}
