package com.hhkungfu.backend.module.user.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.exception.AuthException;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.user.dto.ChangePasswordRequest;
import com.hhkungfu.backend.module.user.dto.ConfirmChangePasswordRequest;
import com.hhkungfu.backend.module.user.dto.UpdateProfileRequest;
import com.hhkungfu.backend.module.user.dto.UserProfileDto;
import com.hhkungfu.backend.module.user.service.UserService;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User management")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}/profile")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiMessage("Lấy thông tin profile thành công")
    @Operation(summary = "Get user profile", description = "Get user profile by ID")
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully")
    public ResponseEntity<UserProfileDto> getProfile(@PathVariable("id") String id) {
        log.info("REST request to get user profile by ID: {}", id);
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @GetMapping("/me/profile")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiMessage("Lấy thông tin profile thành công")
    @Operation(summary = "Get my profile", description = "Get current user profile")
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully")
    public ResponseEntity<UserProfileDto> getMyProfile() {
        log.info("REST request to get current user profile");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @PatchMapping("/me/profile")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiMessage("Cập nhật profile thành công")
    @Operation(summary = "Update user profile", description = "Update current user profile")
    @ApiResponse(responseCode = "200", description = "Profile updated successfully")
    public ResponseEntity<UserProfileDto> updateProfile(@Valid @RequestBody UpdateProfileRequest req) {
        log.info("REST request to update user profile");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        return ResponseEntity.ok(userService.updateProfile(userId, req));
    }

    @PostMapping("/me/password-change/request")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiMessage("Yêu cầu đổi mật khẩu thành công. Vui lòng kiểm tra email để lấy mã OTP.")
    @Operation(summary = "Request change password", description = "Request to change current user password and send OTP")
    @ApiResponse(responseCode = "200", description = "OTP sent successfully")
    public ResponseEntity<Void> requestChangePassword(@Valid @RequestBody ChangePasswordRequest req) {
        log.info("REST request to request change password");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        userService.requestChangePassword(userId, req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/password-change/confirm")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiMessage("Đổi mật khẩu thành công")
    @Operation(summary = "Confirm change password", description = "Confirm password change using OTP")
    @ApiResponse(responseCode = "200", description = "Password changed successfully")
    public ResponseEntity<Void> confirmChangePassword(@Valid @RequestBody ConfirmChangePasswordRequest req) {
        log.info("REST request to confirm change password");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        userService.confirmChangePassword(userId, req);
        return ResponseEntity.ok().build();
    }

    @ApiMessage("Upload avatar thành công")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Upload avatar", description = "Upload avatar for current user")
    @ApiResponse(responseCode = "200", description = "Avatar uploaded successfully")
    @PatchMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> uploadAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        userService.uploadAvatar(userId, file);
        return ResponseEntity.ok().build();
    }
}
