package com.hhkungfu.backend.module.interaction.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.exception.AuthException;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.interaction.dto.RatingSummaryDto;
import com.hhkungfu.backend.module.interaction.service.RatingService;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Ratings", description = "Anime rating management")
public class RatingController {

    private final RatingService ratingService;

    @PostMapping("/ratings/anime/{animeId}")
    @ApiMessage("Đánh giá thành công")
    @Operation(summary = "Rate anime", description = "Submit or update rating for an anime")
    @ApiResponse(responseCode = "200", description = "Rating submitted successfully")
    public ResponseEntity<Void> rateAnime(
            @PathVariable("animeId") Long animeId,
            @RequestBody Map<String, Integer> req) {
        log.info("REST request to rate anime {}: {}", animeId, req);
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));

        Integer score = req.get("score");
        if (score == null) {
            return ResponseEntity.badRequest().build();
        }

        ratingService.rateAnime(userId, animeId, score);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ratings/anime/{animeId}/me")
    @ApiMessage("Lấy đánh giá của tôi thành công")
    @Operation(summary = "Get my rating", description = "Get current user rating for a specific anime")
    @ApiResponse(responseCode = "200", description = "Rating retrieved successfully")
    public ResponseEntity<Map<String, Integer>> getMyRating(@PathVariable("animeId") Long animeId) {
        log.info("REST request to get my rating for anime: {}", animeId);
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        Integer score = ratingService.getMyRating(userId, animeId);
        return ResponseEntity.ok(Map.of("score", score));
    }

    @GetMapping("/ratings/anime/{animeId}/summary")
    @ApiMessage("Lấy thông tin đánh giá tổng quan thành công")
    @Operation(summary = "Get rating summary", description = "Get average score and distribution for an anime")
    @ApiResponse(responseCode = "200", description = "Summary retrieved successfully")
    public ResponseEntity<RatingSummaryDto> getSummary(@PathVariable("animeId") Long animeId) {
        log.info("REST request to get rating summary for anime: {}", animeId);
        return ResponseEntity.ok(ratingService.getRatingSummary(animeId));
    }
}
