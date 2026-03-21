package com.hhkungfu.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Auth custom exception ────────────────────────────────────────────────
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, Object>> handleAuthException(AuthException ex) {
        return buildResponse(false, ex.getMessage(), ex.getErrorCode(), null, ex.getStatus());
    }

    // ── Spring Security: chưa đăng nhập (401) ───────────────────────────────
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex) {
        return buildResponse(false, "Unauthorized", "UNAUTHORIZED", null, HttpStatus.UNAUTHORIZED);
    }

    // ── Spring Security: không có quyền (403) ───────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        return buildResponse(false, "Access denied", "FORBIDDEN", null, HttpStatus.FORBIDDEN);
    }

    // ── Validation: @Valid trên @RequestBody ─────────────────────────────────
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(BusinessException ex) {
        return buildResponse(false, ex.getMessage(), ex.getErrorCode(), null, ex.getStatus());
    }

    // ── HTTP method không được hỗ trợ (405) ──────────────────────────────────
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        String detail = "Method '" + ex.getMethod() + "' not supported";
        return buildResponse(false, detail, "METHOD_NOT_ALLOWED", null, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // ── Content-Type không được hỗ trợ (415) ─────────────────────────────────
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        return buildResponse(false, "Unsupported media type", "UNSUPPORTED_MEDIA_TYPE", null,
                HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    // ── Không tìm thấy route (404) ───────────────────────────────────────────
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFound(ResourceNotFoundException ex) {
        return buildResponse(false, ex.getMessage(), ex.getErrorCode(), null, ex.getStatus());
    }

    // ── Dữ liệu đã tồn tại (409) ───────────────────────────────────────────
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflictException(ConflictException ex) {
        return buildResponse(false, ex.getMessage(), ex.getErrorCode(), null, ex.getStatus());
    }

    // ── Fallback: tất cả exception chưa được bắt (500) ───────────────────────
    // @ExceptionHandler(Exception.class)
    // public ResponseEntity<Map<String, Object>> handleGenericException(Exception
    // ex) {
    // // Không lộ stack trace ra ngoài; log nội bộ ở đây nếu cần
    // return buildResponse(false, "Internal server error", "INTERNAL_SERVER_ERROR",
    // null,
    // HttpStatus.INTERNAL_SERVER_ERROR);
    // }

    // ── Helper ───────────────────────────────────────────────────────────────
    private ResponseEntity<Map<String, Object>> buildResponse(
            boolean success,
            String message,
            String errorCode,
            Map<String, String> details,
            HttpStatus status) {

        Map<String, Object> body = new HashMap<>();
        body.put("success", success);
        body.put("message", message);
        body.put("error", errorCode);
        if (details != null) {
            body.put("details", details);
        }

        return ResponseEntity.status(status).body(body);
    }
}