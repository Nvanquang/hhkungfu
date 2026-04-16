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

import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/v1/files/hls")
@RequiredArgsConstructor
@Tag(name = "HLS Stream", description = "HLS file serving endpoints (m3u8, ts segments)")
public class VideoStreamController {

    private final VideoStreamService videoStreamService;

    // Security: Whitelist quality values — ngăn path traversal qua tham số quality
    private static final Set<String> ALLOWED_QUALITIES = Set.of("360p", "480p", "720p", "1080p");

    // Security: Chỉ cho phép segment name an toàn (chữ cái, số, dấu gạch dưới/ngang)
    private static final Pattern SAFE_SEGMENT_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{1,50}$");

    @GetMapping("/{episodeId}/master.m3u8")
    @Operation(summary = "Serve master.m3u8 playlist")
    public ResponseEntity<Resource> getMasterPlaylist(@PathVariable(name = "episodeId") Long episodeId) {
        // episodeId là Long — type-safe, không cần thêm validation
        Resource resource = videoStreamService.loadHlsFile("ep-" + episodeId + "/master.m3u8");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                // Security: Không cache playlist trên client (dễ stale)
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store")
                .body(resource);
    }

    @GetMapping("/{episodeId}/{quality}/index.m3u8")
    @Operation(summary = "Serve quality-specific playlist")
    public ResponseEntity<Resource> getQualityPlaylist(
            @PathVariable(name = "episodeId") Long episodeId,
            @PathVariable(name = "quality") String quality) {

        // Security: Validate quality whitelist
        if (!ALLOWED_QUALITIES.contains(quality)) {
            log.warn("[VideoSecurity] Path traversal attempt via quality param: episodeId={}, quality='{}'",
                    episodeId, quality);
            return ResponseEntity.badRequest().build();
        }

        Resource resource = videoStreamService.loadHlsFile("ep-" + episodeId + "/" + quality + "/index.m3u8");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store")
                .body(resource);
    }

    @GetMapping("/{episodeId}/{quality}/{segment}.ts")
    @Operation(summary = "Serve .ts video segment (supports Range requests)")
    public ResponseEntity<Resource> getSegment(
            @PathVariable(name = "episodeId") Long episodeId,
            @PathVariable(name = "quality") String quality,
            @PathVariable(name = "segment") String segment,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range) {

        // Security: Validate quality whitelist
        if (!ALLOWED_QUALITIES.contains(quality)) {
            log.warn("[VideoSecurity] Invalid quality param: episodeId={}, quality='{}'", episodeId, quality);
            return ResponseEntity.badRequest().build();
        }

        // Security: Validate segment name (chống path traversal qua ../../)
        if (!SAFE_SEGMENT_PATTERN.matcher(segment).matches()) {
            log.warn("[VideoSecurity] Suspicious segment name: episodeId={}, segment='{}'", episodeId, segment);
            return ResponseEntity.badRequest().build();
        }

        String safePath = "ep-" + episodeId + "/" + quality + "/" + segment + ".ts";
        Resource resource = videoStreamService.loadHlsFile(safePath);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.parseMediaType("video/mp2t").toString())
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                // Security: Cache segments (content immutable) — nhưng không cache lâu quá
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(resource);
    }
}
