package com.hhkungfu.backend.module.user.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.exception.AuthException;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.user.dto.WatchHistoryDto;
import com.hhkungfu.backend.module.user.dto.WatchProgressRequest;
import com.hhkungfu.backend.module.user.service.WatchHistoryService;

@Slf4j
@RestController
@RequestMapping("/api/v1/users/me/watch-history")
@RequiredArgsConstructor
@Tag(name = "User History", description = "User watch history management")
public class WatchHistoryController {

    private final WatchHistoryService watchHistoryService;

    @PostMapping
    @ApiMessage("Cập nhật tiến trình xem thành công")
    @Operation(summary = "Update watch progress", description = "Save or update watching progress for an episode")
    @ApiResponse(responseCode = "200", description = "Progress updated successfully")
    public ResponseEntity<Void> updateProgress(@Valid @RequestBody WatchProgressRequest req) {
        log.info("REST request to update watch progress: {}", req);
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        watchHistoryService.updateProgress(userId, req);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @ApiMessage("Lấy lịch sử xem thành công")
    @Operation(summary = "Get watch history", description = "Get list of recently watched anime")
    @ApiResponse(responseCode = "200", description = "History retrieved successfully")
    public ResponseEntity<Page<WatchHistoryDto>> getMyHistory(@PageableDefault(size = 20) Pageable pageable) {
        log.info("REST request to get my watch history");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        return ResponseEntity.ok(watchHistoryService.getMyWatchHistory(userId, pageable));
    }

    @GetMapping("/anime/{animeId}")
    @ApiMessage("Lấy tiến trình xem anime thành công")
    @Operation(summary = "Get anime watch history", description = "Get last watched episode progress for a specific anime")
    @ApiResponse(responseCode = "200", description = "Anime history retrieved successfully")
    public ResponseEntity<WatchHistoryDto> getAnimeHistory(@PathVariable("animeId") Long animeId) {
        log.info("REST request to get watch history for anime: {}", animeId);
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        WatchHistoryDto history = watchHistoryService.getAnimeWatchHistory(userId, animeId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping
    @ApiMessage("Xóa lịch sử xem thành công")
    @Operation(summary = "Clear watch history", description = "Delete all watch history entries for current user")
    @ApiResponse(responseCode = "204", description = "History cleared successfully")
    public ResponseEntity<Void> clearHistory() {
        log.info("REST request to clear all watch history");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        watchHistoryService.clearHistory(userId);
        return ResponseEntity.noContent().build();
    }
}
