package com.hhkungfu.backend.common.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> fieldErrors.put(e.getField(), e.getDefaultMessage()));

        return buildResponse(false, "Validation failed", "VALIDATION_ERROR", fieldErrors, HttpStatus.BAD_REQUEST);
    }

    // ── Validation: @Validated trên @PathVariable / @RequestParam ────────────
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getConstraintViolations()
                .forEach(v -> fieldErrors.put(v.getPropertyPath().toString(), v.getMessage()));

        return buildResponse(false, "Constraint violation", "CONSTRAINT_VIOLATION", fieldErrors,
                HttpStatus.BAD_REQUEST);
    }

    // ── Request body không đọc được / sai JSON ───────────────────────────────
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        return buildResponse(false, "Malformed or missing request body", "INVALID_REQUEST_BODY", null,
                HttpStatus.BAD_REQUEST);
    }

    // ── @RequestParam bắt buộc bị thiếu ─────────────────────────────────────
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(MissingServletRequestParameterException ex) {
        String detail = "Missing required parameter: " + ex.getParameterName();
        return buildResponse(false, detail, "MISSING_PARAMETER", null, HttpStatus.BAD_REQUEST);
    }

    // ── Sai kiểu tham số (vd: truyền "abc" vào chỗ cần Long) ────────────────
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String detail = String.format("Parameter '%s' should be of type '%s'",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");
        return buildResponse(false, detail, "TYPE_MISMATCH", null, HttpStatus.BAD_REQUEST);
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
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoHandlerFound(NoHandlerFoundException ex) {
        String detail = "No handler found for " + ex.getHttpMethod() + " " + ex.getRequestURL();
        return buildResponse(false, detail, "NOT_FOUND", null, HttpStatus.NOT_FOUND);
    }

    // ── Fallback: tất cả exception chưa được bắt (500) ───────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        // Không lộ stack trace ra ngoài; log nội bộ ở đây nếu cần
        return buildResponse(false, "Internal server error", "INTERNAL_SERVER_ERROR", null,
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