package com.hhkungfu.backend.module.user.controller;

import jakarta.validation.Valid;
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
import com.hhkungfu.backend.module.auth.dto.UserDto;
import com.hhkungfu.backend.module.user.dto.ChangePasswordRequest;
import com.hhkungfu.backend.module.user.dto.UpdateProfileRequest;
import com.hhkungfu.backend.module.user.service.UserService;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "User management")
public class UserController {

    private final UserService userService;

    @GetMapping("/me/profile")
    @ApiMessage("Lấy thông tin profile thành công")
    @Operation(summary = "Get user profile", description = "Get current user profile")
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully")
    public ResponseEntity<UserDto> getMyProfile() {
        log.info("REST request to get current user profile");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        UserDto userDto = userService.getUserProfile(userId);
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/me/profile")
    @ApiMessage("Cập nhật profile thành công")
    @Operation(summary = "Update user profile", description = "Update current user profile")
    @ApiResponse(responseCode = "200", description = "Profile updated successfully")
    public ResponseEntity<UserDto> updateProfile(@Valid @RequestBody UpdateProfileRequest req) {
        log.info("REST request to update user profile");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        UserDto updatedUser = userService.updateProfile(userId, req);
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/me/change-password")
    @ApiMessage("Đổi mật khẩu thành công")
    @Operation(summary = "Change password", description = "Change current user password")
    @ApiResponse(responseCode = "200", description = "Password changed successfully")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        log.info("REST request to change password");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        userService.changePassword(userId, req);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
}
