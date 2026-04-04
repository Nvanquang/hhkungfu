package com.hhkungfu.backend.module.admin.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.admin.dto.response.AnalyticsViewsDataDto;
import com.hhkungfu.backend.module.admin.service.AdminAnalyticsService;
import com.hhkungfu.backend.module.video.service.VideoTranscodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Admin Analytics", description = "Admin analytics APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final VideoTranscodeService videoTranscodeService;

    @GetMapping("/views")
    @ApiMessage("Analytics loaded successfully")
    @Operation(summary = "Views and revenue analytics for a period")
    public ResponseEntity<AnalyticsViewsDataDto> getViews(
            @RequestParam(name = "period", defaultValue = "week") String period,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        String p = period == null || period.isBlank() ? "week" : period;
        return ResponseEntity.ok(adminAnalyticsService.getViewsAnalytics(p, Math.max(1, limit)));
    }

    @PostMapping("/jobs/{jobId}/retry")
    @ApiMessage("Job retry initiated")
    @Operation(summary = "Retry a failed transcode job")
    public ResponseEntity<Void> retryJob(@PathVariable(name = "jobId") Long jobId) {
        videoTranscodeService.retranscode(jobId);
        return ResponseEntity.ok().build();
    }
}
