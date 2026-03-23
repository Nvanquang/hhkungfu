package com.hhkungfu.backend.module.anime.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.anime.dto.AnimeDetailDto;
import com.hhkungfu.backend.module.anime.dto.AnimeSummaryDto;
import com.hhkungfu.backend.module.anime.dto.request.AnimeFilterRequest;
import com.hhkungfu.backend.module.anime.dto.request.CreateAnimeRequest;
import com.hhkungfu.backend.module.anime.dto.request.UpdateAnimeRequest;
import com.hhkungfu.backend.module.anime.service.AnimeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/animes")
@RequiredArgsConstructor
@Tag(name = "Anime", description = "Anime catalog APIs")
public class AnimeController {

    private final AnimeService animeService;

    @GetMapping
    @ApiMessage("Get animes successfully")
    @Operation(summary = "Get animes", description = "Get paginated list of animes")
    @ApiResponse(responseCode = "200", description = "Animes retrieved successfully")
    public ResponseEntity<PageResponse<AnimeSummaryDto>> getAnimes(
            AnimeFilterRequest request) {
        return ResponseEntity.ok(animeService.getAnimes(request));
    }

    @GetMapping("/{idOrSlug}")
    @ApiMessage("Get anime details successfully")
    @Operation(summary = "Get anime details", description = "Get anime details by ID or Slug")
    @ApiResponse(responseCode = "200", description = "Anime details retrieved successfully")
    public ResponseEntity<AnimeDetailDto> getAnimeDetails(@PathVariable("idOrSlug") String idOrSlug) {
        log.info("REST request to get anime details: {}", idOrSlug);
        return ResponseEntity.ok(animeService.getByIdOrSlug(idOrSlug));
    }

    @GetMapping("/search")
    @ApiMessage("Search animes successfully")
    @Operation(summary = "Search animes", description = "Search animes by query string")
    @ApiResponse(responseCode = "200", description = "Animes searched successfully")
    public ResponseEntity<PageResponse<AnimeSummaryDto>> searchAnimes(
            AnimeFilterRequest request) {
        log.info("REST request to search animes: {}", request.getKey());
        return ResponseEntity.ok(animeService.getAnimes(request));
    }

    @GetMapping("/trending")
    @ApiMessage("Get trending animes successfully")
    @Operation(summary = "Get trending animes", description = "Get list of trending animes")
    @ApiResponse(responseCode = "200", description = "Trending animes retrieved successfully")
    public ResponseEntity<PageResponse<AnimeSummaryDto>> getTrendingAnimes(
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        log.info("REST request to get trending animes with limit: {}", limit);
        return ResponseEntity.ok(animeService.getFeaturedAnimes(limit));
    }

    @GetMapping("/featured")
    @ApiMessage("Get featured animes successfully")
    @Operation(summary = "Get featured animes", description = "Get list of featured animes")
    @ApiResponse(responseCode = "200", description = "Featured animes retrieved successfully")
    public ResponseEntity<PageResponse<AnimeSummaryDto>> getFeaturedAnimes() {
        log.info("REST request to get featured animes");
        return ResponseEntity.ok(animeService.getFeaturedAnimes(10));
    }

    @GetMapping("/recently-updated")
    @ApiMessage("Get recently updated animes successfully")
    @Operation(summary = "Get recently updated animes", description = "Get list of recently updated animes")
    @ApiResponse(responseCode = "200", description = "Recently updated animes retrieved successfully")
    public ResponseEntity<PageResponse<AnimeSummaryDto>> getRecentlyUpdatedAnimes(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        log.info("REST request to get recently updated animes");
        Pageable pageable = PageRequest.of(page > 0 ? page - 1 : 0, limit);
        return ResponseEntity.ok(animeService.getRecentlyUpdated(pageable));
    }

    @GetMapping("/{id}/related")
    @ApiMessage("Get related animes successfully")
    @Operation(summary = "Get related animes", description = "Get list of related animes by ID")
    @ApiResponse(responseCode = "200", description = "Related animes retrieved successfully")
    public ResponseEntity<PageResponse<AnimeSummaryDto>> getRelatedAnimes(@PathVariable("id") Long id,
            Pageable pageable) {
        log.info("REST request to get related animes for ID: {}", id);
        return ResponseEntity.ok(animeService.getRelated(id, pageable));
    }

    @PostMapping
    @ApiMessage("Create anime successfully")
    @Operation(summary = "Create anime", description = "Create a new anime")
    @ApiResponse(responseCode = "201", description = "Anime created successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnimeDetailDto> createAnime(@Valid @RequestBody CreateAnimeRequest request) {
        log.info("REST request to create anime");
        return ResponseEntity.status(HttpStatus.CREATED).body(animeService.createAnime(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update anime successfully")
    @Operation(summary = "Update anime", description = "Update an existing anime")
    @ApiResponse(responseCode = "200", description = "Anime updated successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnimeDetailDto> updateAnime(@PathVariable Long id,
            @Valid @RequestBody UpdateAnimeRequest request) {
        log.info("REST request to update anime ID: {}", id);
        return ResponseEntity.ok(animeService.updateAnime(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete anime successfully")
    @Operation(summary = "Delete anime", description = "Delete an anime by ID")
    @ApiResponse(responseCode = "204", description = "Anime deleted successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAnime(@PathVariable Long id) {
        log.info("REST request to delete anime ID: {}", id);
        animeService.deleteAnime(id);
        return ResponseEntity.noContent().build();
    }
}
