package com.hhkungfu.backend.module.auth.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.auth.dto.AuthResponse;
import com.hhkungfu.backend.module.auth.dto.ForgotPasswordRequest;
import com.hhkungfu.backend.module.auth.dto.LoginRequest;
import com.hhkungfu.backend.module.auth.dto.RegisterRequest;
import com.hhkungfu.backend.module.auth.dto.ResetPasswordRequest;
import com.hhkungfu.backend.module.auth.dto.UserDto;
import com.hhkungfu.backend.module.auth.dto.VerifyOtpRequest;
import com.hhkungfu.backend.module.auth.service.AuthService;
import com.hhkungfu.backend.common.exception.AuthException;
import com.hhkungfu.backend.common.exception.ErrorConstants;

import java.util.Arrays;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication APIs")
public class AuthController {

    private final AuthService authService;

    @Value("${security.authentication.jwt.access-token-validity-in-seconds}")
    private long accessTokenExpiration;

    @Value("${security.authentication.jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenExpiration;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiMessage("Vui lòng kiểm tra email để xác thực tài khoản")
    @Operation(summary = "Register user", description = "Register a new user")
    @ApiResponse(responseCode = "201", description = "User registered successfully")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        log.info("REST request to register User: {}", req.email());
        AuthResponse res = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/login")
    @ApiMessage("Đăng nhập thành công")
    @Operation(summary = "Login", description = "Authenticate user and return tokens")
    @ApiResponse(responseCode = "200", description = "User logged in successfully")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        log.info("REST request to login User: {}", req.email());
        AuthResponse res = authService.login(req);

        // Tạo HTTP-Only cookie
        ResponseCookie refreshTokenCookie = buildRefreshTokenCookie(res.getRefreshToken());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString()).body(res);
    }

    @PostMapping("/verify-email")
    @ApiMessage("Xác thực email thành công")
    @Operation(summary = "Verify email", description = "Verify user email using OTP")
    @ApiResponse(responseCode = "200", description = "Email verified successfully")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyOtpRequest req) {
        log.info("REST request to verify email: {}", req.email());
        authService.verifyEmail(req);
        return ResponseEntity.ok(Map.of("message", "Xác thực email thành công"));
    }

    @PostMapping("/resend-verification")
    @ApiMessage("OTP đã được gửi lại")
    @Operation(summary = "Resend verification", description = "Resend verification OTP to email")
    @ApiResponse(responseCode = "200", description = "OTP resent successfully")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        log.info("REST request to resend verification OTP for: {}", email);
        authService.resendVerification(email);
        return ResponseEntity.ok(Map.of("message", "OTP đã được gửi lại"));
    }

    @PostMapping("/refresh")
    @ApiMessage("Làm mới token thành công")
    @Operation(summary = "Refresh token", description = "Get new access token using refresh token")
    @ApiResponse(responseCode = "200", description = "Token refreshed successfully")
    public ResponseEntity<Map<String, Object>> refreshToken(HttpServletRequest req) {
        log.info("REST request to refresh token");

        String refreshToken = extractRefreshTokenFromCookie(req);
        AuthResponse res = authService.refreshToken(refreshToken);

        // Tạo HTTP-Only cookie
        ResponseCookie refreshTokenCookie = buildRefreshTokenCookie(res.getRefreshToken());

        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString()).body(
                Map.of("accessToken", res.getAccessToken(), "expiresIn", accessTokenExpiration));
    }

    @PostMapping("/logout")
    @ApiMessage("Đăng xuất thành công")
    @Operation(summary = "Logout user", description = "Logout current user and revoke token")
    @ApiResponse(responseCode = "200", description = "User logged out successfully")
    public ResponseEntity<Map<String, String>> logout() {
        log.info("REST request to logout User");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED,
                        ErrorConstants.UNAUTHORIZED.getCode()));
        authService.logout(userId);

        // reset refresh token
        ResponseCookie refreshTokenCookie = this.resetRefreshTokenCookie();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(Map.of("message", "Đăng xuất thành công"));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiMessage("Lấy thông tin profile thành công")
    @Operation(summary = "Get current user", description = "Get current authenticated user information")
    @ApiResponse(responseCode = "200", description = "Current user information retrieved")
    public ResponseEntity<UserDto> getMe() {
        log.info("REST request to get current User information");
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", HttpStatus.UNAUTHORIZED,
                        ErrorConstants.UNAUTHORIZED.getCode()));
        UserDto userDto = authService.getMe(userId);
        return ResponseEntity.ok(userDto);
    }

    @PostMapping("/forgot-password")
    @ApiMessage("Nếu email tồn tại, OTP đã được gửi")
    @Operation(summary = "Forgot password", description = "Request OTP for resetting password")
    @ApiResponse(responseCode = "200", description = "Forgot password request processed")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        log.info("REST request to forgot password for: {}", req.email());
        authService.forgotPassword(req);
        return ResponseEntity.ok(Map.of("message", "Nếu email tồn tại, OTP đã được gửi"));
    }

    @PostMapping("/reset-password")
    @ApiMessage("Mật khẩu đã được cập nhật")
    @Operation(summary = "Reset password", description = "Reset user password using OTP")
    @ApiResponse(responseCode = "200", description = "Password reset successfully")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        log.info("REST request to reset password for: {}", req.email());
        authService.resetPassword(req);
        return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được cập nhật"));
    }

    private ResponseCookie buildRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(accessTokenExpiration)
                .build();
    }

    private ResponseCookie resetRefreshTokenCookie() {
        return ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new AuthException(
                    "Không tìm thấy refresh token",
                    HttpStatus.UNAUTHORIZED,
                    ErrorConstants.UNAUTHORIZED.getCode());
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> "refresh_token".equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElseThrow(() -> new AuthException(
                        "Refresh token không hợp lệ",
                        HttpStatus.UNAUTHORIZED,
                        ErrorConstants.UNAUTHORIZED.getCode()));
    }
}
