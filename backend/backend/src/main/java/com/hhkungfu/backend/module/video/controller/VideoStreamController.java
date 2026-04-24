package com.hhkungfu.backend.module.video.controller;

import com.hhkungfu.backend.module.video.service.VideoStreamService;
import com.hhkungfu.backend.module.video.service.VideoTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/v1/files/hls")
@RequiredArgsConstructor
@Tag(name = "HLS Stream", description = "HLS file serving endpoints (m3u8, ts segments)")
public class VideoStreamController {

    private final VideoStreamService videoStreamService;
    private final VideoTokenService videoTokenService;

    // Security: Whitelist quality values
    private static final Set<String> ALLOWED_QUALITIES = Set.of("360p", "480p", "720p", "1080p");

    // Security: Pattern for safe file names (index.m3u8, init.mp4, seg000.m4s, etc)
    private static final Pattern SAFE_FILE_PATTERN = Pattern.compile("^[a-zA-Z0-9_.-]{1,50}$");

    @GetMapping("/{episodeId}/master.m3u8")
    @Operation(summary = "Serve master.m3u8 playlist")
    public ResponseEntity<Resource> getMasterPlaylist(
            @PathVariable(name = "episodeId") Long episodeId,
            @RequestParam(name = "token", required = false) String token) {

        try {
            videoTokenService.validateToken(token, episodeId);
        } catch (SecurityException e) {
            log.warn("[VideoSecurity] Invalid token for episodeId={}: {}", episodeId, e.getMessage());
            return ResponseEntity.status(403).build();
        }

        Resource resource = videoStreamService.loadHlsFile("ep-" + episodeId + "/master.m3u8");
        if (resource == null)
            return ResponseEntity.notFound().build();

        if (token != null) {
            try {
                String modifiedPlaylist = injectTokenIntoPlaylist(resource, token);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "application/vnd.apple.mpegurl")
                        .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store")
                        .body(new org.springframework.core.io.ByteArrayResource(
                                modifiedPlaylist.getBytes(StandardCharsets.UTF_8)));
            } catch (IOException e) {
                log.error("Failed to inject token into master playlist for episode {}", episodeId, e);
                // Fallback to original resource if rewrite fails
            }
        }

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
            @PathVariable(name = "fileName") String fileName,
            @RequestParam(name = "token", required = false) String token) {

        try {
            videoTokenService.validateToken(token, episodeId);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        }

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
        if (resource == null)
            return ResponseEntity.notFound().build();

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
            if (token != null) {
                try {
                    String modifiedPlaylist = injectTokenIntoPlaylist(resource, token);
                    return responseBuilder.body(new org.springframework.core.io.ByteArrayResource(
                            modifiedPlaylist.getBytes(StandardCharsets.UTF_8)));
                } catch (Exception e) {
                    log.error("Failed to inject token into playlist", e);
                }
            }
        } else {
            responseBuilder.header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600");
        }

        return responseBuilder.body(resource);
    }

    @GetMapping("/{episodeId}/thumbnails/{fileName}")
    @Operation(summary = "Serve video thumbnails (sprite, vtt)")
    public ResponseEntity<Resource> getThumbnails(
            @PathVariable(name = "episodeId") Long episodeId,
            @PathVariable(name = "fileName") String fileName) {

        // 1. Security: Validate filename
        if (!SAFE_FILE_PATTERN.matcher(fileName).matches()) {
            log.warn("[VideoSecurity] Suspicious thumbnail filename: episodeId={}, fileName='{}'", episodeId, fileName);
            return ResponseEntity.badRequest().build();
        }

        // 2. Load file
        String safePath = "ep-" + episodeId + "/thumbnails/" + fileName;
        Resource resource = videoStreamService.loadHlsFile(safePath);
        if (resource == null) {
            return ResponseEntity.notFound().build();
        }

        // 3. Determine Content-Type
        String contentType = "application/octet-stream";
        if (fileName.endsWith(".vtt")) {
            contentType = "text/vtt";
        } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        }

        // 4. Cache & stream
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(resource);
    }

    private String injectTokenIntoPlaylist(Resource resource, String token) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("#") && !line.isBlank()) {
                    // It's a URI line (sub-playlist or segment)
                    String separator = line.contains("?") ? "&" : "?";
                    sb.append(line).append(separator).append("token=").append(token).append("\n");
                } else if (line.startsWith("#EXT-X-") && line.contains("URI=\"")) {
                    // Handle tags with URI attribute (e.g., #EXT-X-MAP:URI="init.mp4")
                    int uriStartIndex = line.indexOf("URI=\"") + 5;
                    int uriEndIndex = line.indexOf("\"", uriStartIndex);
                    if (uriStartIndex > 4 && uriEndIndex > uriStartIndex) {
                        String uri = line.substring(uriStartIndex, uriEndIndex);
                        String separator = uri.contains("?") ? "&" : "?";
                        String modifiedUri = uri + separator + "token=" + token;
                        line = line.substring(0, uriStartIndex) + modifiedUri + line.substring(uriEndIndex);
                    }
                    sb.append(line).append("\n");
                } else {
                    sb.append(line).append("\n");
                }
            }
        }
        return sb.toString();
    }
}
