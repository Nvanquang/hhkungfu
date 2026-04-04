package com.hhkungfu.backend.module.admin.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.admin.dto.AdminRatingStatsDto;
import com.hhkungfu.backend.module.admin.dto.AdminRatingSummaryDto;
import com.hhkungfu.backend.module.admin.service.AdminRatingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/ratings")
@RequiredArgsConstructor
@Tag(name = "Admin/Rating", description = "Admin Rating Analytics APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRatingController {

    private final AdminRatingService adminRatingService;

    @GetMapping("/stats")
    @ApiMessage("Lấy thống kê đánh giá (Admin) thành công")
    @Operation(summary = "Get anime rating statistics", description = "Get paginated anime with average score and rating distribution")
    public ResponseEntity<PageResponse<AdminRatingStatsDto>> getAnimeRatingStats(
            @RequestParam(name = "search", required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(adminRatingService.getAnimeRatingStats(search, pageable));
    }

    @GetMapping("/summary")
    @ApiMessage("Lấy tổng quan thống kê đánh giá (Admin) thành công")
    @Operation(summary = "Get anime rating summary", description = "Get overall rating summary for admin")
    public ResponseEntity<AdminRatingSummaryDto> getAnimeRatingSummary() {
        return ResponseEntity.ok(adminRatingService.getAnimeRatingSummary());
    }
}
