package com.hhkungfu.backend.module.episode.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.episode.dto.CreateEpisodeRequest;
import com.hhkungfu.backend.module.episode.dto.EpisodeDto;
import com.hhkungfu.backend.module.episode.service.EpisodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Episode", description = "Episode management APIs")
public class EpisodeController {

    private final EpisodeService episodeService;

    // ── Public ──────────────────────────────────────────────────────────────

    @GetMapping("/animes/{animeId}/episodes")
    @ApiMessage("Get episodes successfully")
    @Operation(summary = "Get episode list of an anime")
    public ResponseEntity<PageResponse<EpisodeDto>> getEpisodes(
            @PathVariable(name = "animeId") Long animeId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        log.info("REST request to get episodes for anime {}", animeId);
        return ResponseEntity.ok(episodeService.getEpisodesByAnime(animeId, page, limit));
    }

    @GetMapping("/animes/{animeId}/episodes/{episodeNumber}")
    @ApiMessage("Get episode details successfully")
    @Operation(summary = "Get episode details by number")
    public ResponseEntity<EpisodeDto> getEpisode(
            @PathVariable(name = "animeId") Long animeId,
            @PathVariable(name = "episodeNumber") Integer episodeNumber) {
        log.info("REST request to get episode #{} of anime {}", episodeNumber, animeId);
        return ResponseEntity.ok(episodeService.getEpisodeByNumber(animeId, episodeNumber));
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    @PostMapping("/animes/{animeId}/episodes")
    @ApiMessage("Episode created successfully")
    @Operation(summary = "Create a new episode (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EpisodeDto> createEpisode(
            @PathVariable(name = "animeId") Long animeId,
            @RequestBody @Valid CreateEpisodeRequest request) {
        log.info("REST request to create episode for anime {}", animeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(episodeService.createEpisode(animeId, request));
    }

    @DeleteMapping("/episodes/{id}")
    @ApiMessage("Episode deleted successfully")
    @Operation(summary = "Soft-delete an episode (Admin)")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteEpisode(@PathVariable(name = "id") Long id) {
        log.info("REST request to delete episode {}", id);
        episodeService.softDeleteEpisode(id);
        return ResponseEntity.noContent().build();
    }
}
