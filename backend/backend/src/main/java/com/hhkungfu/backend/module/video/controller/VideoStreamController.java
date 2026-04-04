package com.hhkungfu.backend.module.video.controller;

import com.hhkungfu.backend.module.video.service.VideoStreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/files/hls")
@RequiredArgsConstructor
@Tag(name = "HLS Stream", description = "HLS file serving endpoints (m3u8, ts segments)")
public class VideoStreamController {

    private final VideoStreamService videoStreamService;

    @GetMapping("/{episodeId}/master.m3u8")
    @Operation(summary = "Serve master.m3u8 playlist")
    public ResponseEntity<Resource> getMasterPlaylist(@PathVariable(name = "episodeId") Long episodeId) {
        Resource resource = videoStreamService.loadHlsFile("ep-" + episodeId + "/master.m3u8");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .body(resource);
    }

    @GetMapping("/{episodeId}/{quality}/index.m3u8")
    @Operation(summary = "Serve quality-specific playlist")
    public ResponseEntity<Resource> getQualityPlaylist(
            @PathVariable(name = "episodeId") Long episodeId,
            @PathVariable(name = "quality") String quality) {
        Resource resource = videoStreamService.loadHlsFile("ep-" + episodeId + "/" + quality + "/index.m3u8");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .body(resource);
    }

    @GetMapping("/{episodeId}/{quality}/{segment}.ts")
    @Operation(summary = "Serve .ts video segment (supports Range requests)")
    public ResponseEntity<Resource> getSegment(
            @PathVariable(name = "episodeId") Long episodeId,
            @PathVariable(name = "quality") String quality,
            @PathVariable(name = "segment") String segment,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range) {
        Resource resource = videoStreamService.loadHlsFile("ep-" + episodeId + "/" + quality + "/" + segment + ".ts");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.parseMediaType("video/mp2t").toString())
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .body(resource);
    }
}
