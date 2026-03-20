package com.hhkungfu.backend.module.comment.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.comment.dto.*;
import com.hhkungfu.backend.module.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Comment", description = "Comment APIs")
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/episodes/{episodeId}/comments")
    @ApiMessage("Get comments successfully")
    @Operation(summary = "Get episode comments", description = "Get paginated root comments for an episode")
    @ApiResponse(responseCode = "200", description = "Comments retrieved successfully")
    public ResponseEntity<PageResponse<CommentDto>> getComments(
            @PathVariable Long episodeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        UUID currentUserId = SecurityUtil.getCurrentUserId()
                .map(UUID::fromString)
                .orElse(null);
        
        return ResponseEntity.ok(commentService.getCommentsByEpisode(episodeId, currentUserId, pageable));
    }

    @GetMapping("/comments/{commentId}/replies")
    @ApiMessage("Get replies successfully")
    @Operation(summary = "Get comment replies", description = "Get paginated replies for a comment")
    @ApiResponse(responseCode = "200", description = "Replies retrieved successfully")
    public ResponseEntity<PageResponse<CommentDto>> getReplies(
            @PathVariable Long commentId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        
        UUID currentUserId = SecurityUtil.getCurrentUserId()
                .map(UUID::fromString)
                .orElse(null);
                
        return ResponseEntity.ok(commentService.getReplies(commentId, currentUserId, pageable));
    }

    @PostMapping("/episodes/{episodeId}/comments")
    @ApiMessage("Create comment successfully")
    @Operation(summary = "Create comment or reply", description = "Create a new comment or a reply to an existing comment")
    @ApiResponse(responseCode = "201", description = "Comment created successfully")
    public ResponseEntity<CommentDto> createComment(
            @PathVariable Long episodeId,
            @Valid @RequestBody CreateCommentRequest request) {
        
        UUID currentUserId = SecurityUtil.getCurrentUserId()
                .map(UUID::fromString)
                .orElseThrow(() -> new RuntimeException("Unauthorized")); // Should be handled by Security filter
                
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(episodeId, currentUserId, request));
    }

    @PatchMapping("/comments/{id}")
    @ApiMessage("Update comment successfully")
    @Operation(summary = "Update comment", description = "Update the content of an existing comment")
    @ApiResponse(responseCode = "200", description = "Comment updated successfully")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommentRequest request) {
            
        UUID currentUserId = SecurityUtil.getCurrentUserId()
                .map(UUID::fromString)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
                
        return ResponseEntity.ok(commentService.updateComment(id, currentUserId, request));
    }

    @DeleteMapping("/comments/{id}")
    @ApiMessage("Delete comment successfully")
    @Operation(summary = "Delete comment", description = "Soft delete a comment (by owner or admin)")
    @ApiResponse(responseCode = "204", description = "Comment deleted successfully")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID currentUserId = SecurityUtil.getCurrentUserId()
                .map(UUID::fromString)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
        
        String role = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse("USER");
                
        commentService.deleteComment(id, currentUserId, role);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/comments/{id}/like")
    @ApiMessage("Toggle like successfully")
    @Operation(summary = "Toggle like", description = "Toggle like/unlike for a comment")
    @ApiResponse(responseCode = "200", description = "Like toggled successfully")
    public ResponseEntity<CommentLikeResponse> toggleLike(@PathVariable Long id) {
        UUID currentUserId = SecurityUtil.getCurrentUserId()
                .map(UUID::fromString)
                .orElseThrow(() -> new RuntimeException("Unauthorized"));
                
        return ResponseEntity.ok(commentService.toggleLike(id, currentUserId));
    }
}
