package com.hhkungfu.backend.module.anime.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.anime.dto.GenreDto;
import com.hhkungfu.backend.module.anime.dto.request.CreateGenreRequest;
import com.hhkungfu.backend.module.anime.service.GenreService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/genres")
@RequiredArgsConstructor
@Tag(name = "Genre", description = "Genre catalog APIs")
public class GenreController {

    private final GenreService genreService;

    @GetMapping
    @ApiMessage("Get all genres successfully")
    @Operation(summary = "Get all genres", description = "Get list of all genres")
    @ApiResponse(responseCode = "200", description = "Genres retrieved successfully")
    public ResponseEntity<List<GenreDto>> getAllGenres() {
        log.info("REST request to get all genres");
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    @PostMapping
    @ApiMessage("Create genre successfully")
    @Operation(summary = "Create genre", description = "Create a new genre")
    @ApiResponse(responseCode = "201", description = "Genre created successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GenreDto> createGenre(@Valid @RequestBody CreateGenreRequest request) {
        log.info("REST request to create genre");
        return ResponseEntity.status(HttpStatus.CREATED).body(genreService.createGenre(request));
    }
}
