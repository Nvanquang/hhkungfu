package com.hhkungfu.backend.module.interaction.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.interaction.dto.BookmarkDto;
import com.hhkungfu.backend.module.interaction.service.BookmarkService;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/users/me/bookmarks")
@RequiredArgsConstructor
@Tag(name = "User Bookmarks", description = "User bookmark management")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{animeId}")
    @ApiMessage("Bookmark thành công")
    @Operation(summary = "Add bookmark", description = "Bookmark an anime")
    @ApiResponse(responseCode = "201", description = "Anime bookmarked successfully")
    public ResponseEntity<Void> addBookmark(@PathVariable("animeId") Long animeId) {
        log.info("REST request to add bookmark for anime: {}", animeId);
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        bookmarkService.addBookmark(userId, animeId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{animeId}")
    @ApiMessage("Xóa bookmark thành công")
    @Operation(summary = "Remove bookmark", description = "Remove an anime from bookmarks")
    @ApiResponse(responseCode = "204", description = "Bookmark removed successfully")
    public ResponseEntity<Void> removeBookmark(@PathVariable("animeId") Long animeId) {
        log.info("REST request to remove bookmark for anime: {}", animeId);
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        bookmarkService.removeBookmark(userId, animeId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{animeId}/status")
    @ApiMessage("Kiểm tra trạng thái bookmark thành công")
    @Operation(summary = "Check bookmark status", description = "Check if an anime is bookmarked by current user")
    @ApiResponse(responseCode = "200", description = "Status retrieved successfully")
    public ResponseEntity<Map<String, Boolean>> checkStatus(@PathVariable("animeId") Long animeId) {
        log.info("REST request to check bookmark status for anime: {}", animeId);
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        boolean isBookmarked = bookmarkService.isBookmarked(userId, animeId);
        return ResponseEntity.ok(Map.of("isBookmarked", isBookmarked));
    }

    @GetMapping
    @ApiMessage("Lấy danh sách bookmark thành công")
    @Operation(summary = "Get my bookmarks", description = "Get list of bookmarked anime")
    @ApiResponse(responseCode = "200", description = "Bookmarks retrieved successfully")
    public ResponseEntity<PageResponse<BookmarkDto>> getMyBookmarks(@PageableDefault(size = 20) Pageable pageable) {
        log.info("REST request to get my bookmarks");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        return ResponseEntity.ok(bookmarkService.getMyBookmarks(userId, pageable));
    }
}
