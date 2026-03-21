package com.hhkungfu.backend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(UnauthorizedException ex) {
        return buildResponse(false, "Unauthorized", ex.getErrorCode(), null, ex.getStatus());
    }

    // ── Spring Security: không có quyền (403) ───────────────────────────────
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(ForbiddenException ex) {
        return buildResponse(false, "Access denied", ex.getErrorCode(), null, ex.getStatus());
    }

    // ── Validation: @Valid trên @RequestBody ─────────────────────────────────
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BusinessException ex) {
        return buildResponse(false, ex.getMessage(), ex.getErrorCode(), null, ex.getStatus());
    }

    // ── Bad Request: lỗi nhập liệu hoặc logic nghiệp vụ sai (400) ─────────────
    @ExceptionHandler(BadRequestAlertException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequestAlertException(BadRequestAlertException ex) {
        return buildResponse(false, ex.getMessage(), ex.getErrorCode(), null, ex.getStatus());
    }

    // ── Validation: @Valid trên @RequestBody (400) ──────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return buildResponse(false, "Validation failed", ErrorConstants.VALIDATION_ERROR.getCode(), errors,
                HttpStatus.BAD_REQUEST);
    }

    // ── HTTP method không được hỗ trợ (405) ──────────────────────────────────
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        String detail = "Method '" + ex.getMethod() + "' not supported";
        return buildResponse(false, detail, ErrorConstants.METHOD_NOT_ALLOWED.getCode(), null,
                HttpStatus.METHOD_NOT_ALLOWED);
    }

    // ── Content-Type không được hỗ trợ (415) ─────────────────────────────────
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        return buildResponse(false, "Unsupported media type", ErrorConstants.CONTENT_TYPE_NOT_SUPPORTED.getCode(), null,
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
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        // Không lộ stack trace ra ngoài; log nội bộ ở đây nếu cần
        return buildResponse(false, "Internal server error", ErrorConstants.INTERNAL_SERVER_ERROR.getCode(),
                null,
                HttpStatus.INTERNAL_SERVER_ERROR);
    }

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