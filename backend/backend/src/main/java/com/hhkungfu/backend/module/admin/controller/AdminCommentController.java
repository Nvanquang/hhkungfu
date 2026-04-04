package com.hhkungfu.backend.module.admin.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.admin.dto.AdminCommentDto;
import com.hhkungfu.backend.module.admin.service.AdminCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/comments")
@RequiredArgsConstructor
@Tag(name = "Admin/Comment", description = "Admin Comment Moderation APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCommentController {

    private final AdminCommentService adminCommentService;

    @GetMapping
    @ApiMessage("Lấy danh sách bình luận (Admin) thành công")
    @Operation(summary = "Get comments with administration filters", description = "Get paginated comments with advanced filters for moderation")
    public ResponseEntity<PageResponse<AdminCommentDto>> getAllComments(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "username", required = false) String username,
            @RequestParam(name = "animeId", required = false) Long animeId,
            @RequestParam(name = "type", required = false) String type,
            @RequestParam(name = "isDeleted", required = false) Boolean isDeleted,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(adminCommentService.getAllCommentsManaged(
                search, username, animeId, type, isDeleted, pageable));
    }

    @PatchMapping("/{id}/pin")
    @ApiMessage("Thay đổi trạng thái ghim thành công")
    @Operation(summary = "Toggle pin comment", description = "Pin or unpin a comment for its episode")
    @ApiResponse(responseCode = "200", description = "Pin status updated")
    public ResponseEntity<Void> togglePin(@PathVariable(name = "id") Long id) {
        adminCommentService.togglePin(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @ApiMessage("Xóa bình luận thành công")
    @Operation(summary = "Admin soft delete comment", description = "Mark a comment and its replies as deleted")
    @ApiResponse(responseCode = "204", description = "Comment deleted")
    public ResponseEntity<Void> deleteComment(@PathVariable(name = "id") Long id) {
        adminCommentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
