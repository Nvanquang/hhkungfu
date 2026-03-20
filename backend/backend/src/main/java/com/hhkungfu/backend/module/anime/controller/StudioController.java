package com.hhkungfu.backend.module.anime.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.anime.dto.StudioDto;
import com.hhkungfu.backend.module.anime.service.StudioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/studios")
@RequiredArgsConstructor
@Tag(name = "Studio", description = "Studio catalog APIs")
public class StudioController {

    private final StudioService studioService;

    @GetMapping
    @ApiMessage("Get all studios successfully")
    @Operation(summary = "Get all studios", description = "Get list of all studios")
    @ApiResponse(responseCode = "200", description = "Studios retrieved successfully")
    public ResponseEntity<List<StudioDto>> getAllStudios() {
        log.info("REST request to get all studios");
        return ResponseEntity.ok(studioService.getAllStudios());
    }
}
