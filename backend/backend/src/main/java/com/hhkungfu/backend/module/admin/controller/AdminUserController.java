package com.hhkungfu.backend.module.admin.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.admin.dto.request.PatchUserStatusRequest;
import com.hhkungfu.backend.module.admin.dto.response.AdminUserListDataDto;
import com.hhkungfu.backend.module.admin.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin Users", description = "Admin user management APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @ApiMessage("Users listed successfully")
    @Operation(summary = "List users with filters")
    public ResponseEntity<AdminUserListDataDto> listUsers(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "20") int limit,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "isActive", required = false) Boolean isActive) {
        return ResponseEntity.ok(adminUserService.listUsers(page, limit, search, isActive));
    }

    @PatchMapping("/{id}/status")
    @ApiMessage("Cập nhật trạng thái người dùng thành công")
    @Operation(summary = "Activate or deactivate user")
    public ResponseEntity<Void> updateStatus(@PathVariable(name = "id") UUID id,
            @Valid @RequestBody PatchUserStatusRequest request) {
        adminUserService.updateStatus(id, request);
        return ResponseEntity.ok().build();
    }
}
