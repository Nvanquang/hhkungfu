package com.hhkungfu.backend.module.video.controller;

import com.hhkungfu.backend.module.video.service.VideoStreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/v1/files/hls")
@RequiredArgsConstructor
@Tag(name = "HLS Stream", description = "HLS file serving endpoints (m3u8, ts segments)")
public class VideoStreamController {

    private final VideoStreamService videoStreamService;

    // Security: Whitelist quality values
    private static final Set<String> ALLOWED_QUALITIES = Set.of("360p", "480p", "720p", "1080p");

    // Security: Pattern for safe file names (index.m3u8, init.mp4, seg000.m4s, etc)
    private static final Pattern SAFE_FILE_PATTERN = Pattern.compile("^[a-zA-Z0-9_.-]{1,50}$");

    @GetMapping("/{episodeId}/master.m3u8")
    @Operation(summary = "Serve master.m3u8 playlist")
    public ResponseEntity<Resource> getMasterPlaylist(@PathVariable(name = "episodeId") Long episodeId) {
        Resource resource = videoStreamService.loadHlsFile("ep-" + episodeId + "/master.m3u8");
        if (resource == null) return ResponseEntity.notFound().build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store")
                .body(resource);
    }

    @GetMapping("/{episodeId}/{quality}/{fileName}")
    @Operation(summary = "Serve HLS components (index.m3u8, init.mp4, segments)")
    public ResponseEntity<Resource> getHlsComponent(
            @PathVariable(name = "episodeId") Long episodeId,
            @PathVariable(name = "quality") String quality,
            @PathVariable(name = "fileName") String fileName) {

        // 1. Security: Validate quality
        if (!ALLOWED_QUALITIES.contains(quality)) {
            log.warn("[VideoSecurity] Invalid quality param: episodeId={}, quality='{}'", episodeId, quality);
            return ResponseEntity.badRequest().build();
        }

        // 2. Security: Validate filename to prevent path traversal
        if (!SAFE_FILE_PATTERN.matcher(fileName).matches()) {
            log.warn("[VideoSecurity] Suspicious filename: episodeId={}, fileName='{}'", episodeId, fileName);
            return ResponseEntity.badRequest().build();
        }

        // 3. Load file
        String safePath = "ep-" + episodeId + "/" + quality + "/" + fileName;
        Resource resource = videoStreamService.loadHlsFile(safePath);
        if (resource == null) return ResponseEntity.notFound().build();

        // 4. Determine Content-Type
        String contentType = "application/octet-stream";
        if (fileName.endsWith(".m3u8")) {
            contentType = "application/vnd.apple.mpegurl";
        } else if (fileName.endsWith(".mp4") || fileName.endsWith(".m4s")) {
            contentType = "video/mp4";
        } else if (fileName.endsWith(".ts")) {
            contentType = "video/mp2t";
        }

        // 5. Build Response
        var responseBuilder = ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes");

        // Cache control: Playlists should not be cached, segments can be
        if (fileName.endsWith(".m3u8")) {
            responseBuilder.header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store");
        } else {
            responseBuilder.header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600");
        }

        return responseBuilder.body(resource);
    }

    @GetMapping("/{episodeId}/thumbnails/{fileName}")
    @Operation(summary = "Serve video thumbnails (sprite, vtt)")
    public void getThumbnails(
            @PathVariable(name = "episodeId") Long episodeId,
            @PathVariable(name = "fileName") String fileName,
            HttpServletResponse response) throws IOException {

        // 1. Security: Validate filename
        if (!SAFE_FILE_PATTERN.matcher(fileName).matches()) {
            log.warn("[VideoSecurity] Suspicious thumbnail filename: episodeId={}, fileName='{}'", episodeId, fileName);
            response.sendError(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        // 2. Load file
        String safePath = "ep-" + episodeId + "/thumbnails/" + fileName;
        Resource resource = videoStreamService.loadHlsFile(safePath);
        if (resource == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        // 3. Determine Content-Type
        if (fileName.endsWith(".vtt")) {
            response.setContentType("text/vtt");
        } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            response.setContentType("image/jpeg");
        } else {
            response.setContentType("application/octet-stream");
        }

        // 4. Cache & stream
        response.setHeader(HttpHeaders.CACHE_CONTROL, "public, max-age=86400");
        try (InputStream is = resource.getInputStream()) {
            StreamUtils.copy(is, response.getOutputStream());
        }
    }
}
