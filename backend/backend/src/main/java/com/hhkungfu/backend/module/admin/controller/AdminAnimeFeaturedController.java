package com.hhkungfu.backend.module.admin.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.admin.dto.request.PatchAnimeFeaturedRequest;
import com.hhkungfu.backend.module.admin.service.AdminFeaturedAnimeService;
import com.hhkungfu.backend.module.anime.enums.AnimeImageType;
import com.hhkungfu.backend.module.anime.service.AnimeService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/animes")
@RequiredArgsConstructor
@Tag(name = "Admin Anime", description = "Admin anime flags")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnimeFeaturedController {

    private final AdminFeaturedAnimeService adminFeaturedAnimeService;
    private final AnimeService animeService;

    @PatchMapping("/{id}/featured")
    @ApiMessage("Cập nhật trạng thái nổi bật của anime thành công")
    @Operation(summary = "Set anime featured flag")
    public ResponseEntity<Void> updateFeatured(@PathVariable(name = "id") Long id,
            @Valid @RequestBody PatchAnimeFeaturedRequest request) {
        adminFeaturedAnimeService.updateFeatured(id, request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ApiMessage("Upload image successfully")
    @Operation(summary = "Upload anime image")
    public ResponseEntity<Void> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") AnimeImageType type // enum: THUMBNAIL, BANNER
    ) throws IOException {
        animeService.uploadImage(id, file, type);
        return ResponseEntity.ok().build();
    }
}
