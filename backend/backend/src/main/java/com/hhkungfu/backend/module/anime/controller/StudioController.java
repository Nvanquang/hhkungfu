package com.hhkungfu.backend.module.anime.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.anime.dto.StudioDto;
import com.hhkungfu.backend.module.anime.dto.request.CreateStudioRequest;
import com.hhkungfu.backend.module.anime.dto.request.UpdateStudioRequest;
import com.hhkungfu.backend.module.anime.service.StudioService;
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

    @PostMapping
    @ApiMessage("Create studio successfully")
    @Operation(summary = "Create studio", description = "Create a new studio")
    @ApiResponse(responseCode = "201", description = "Studio created successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudioDto> createStudio(@Valid @RequestBody CreateStudioRequest request) {
        log.info("REST request to create studio");
        return ResponseEntity.status(HttpStatus.CREATED).body(studioService.createStudio(request));
    }

    @PutMapping("/{id}")
    @ApiMessage("Update studio successfully")
    @Operation(summary = "Update studio", description = "Update an existing studio")
    @ApiResponse(responseCode = "200", description = "Studio updated successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudioDto> updateStudio(@PathVariable(name = "id") Long id,
            @Valid @RequestBody UpdateStudioRequest request) {
        log.info("REST request to update studio: {}", id);
        return ResponseEntity.ok(studioService.updateStudio(id, request));
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Delete studio successfully")
    @Operation(summary = "Delete studio", description = "Delete a studio")
    @ApiResponse(responseCode = "200", description = "Studio deleted successfully")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteStudio(@PathVariable(name = "id") Long id) {
        log.info("REST request to delete studio: {}", id);
        studioService.deleteStudio(id);
        return ResponseEntity.ok().build();
    }
}
