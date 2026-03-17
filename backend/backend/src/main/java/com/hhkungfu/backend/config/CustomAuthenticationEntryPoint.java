package com.hhkungfu.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.response.ErrorResponse; // Nhập ErrorResponse import

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // 1. Khởi tạo cục object chi tiết lỗi như cũ (Đóng vai trò như cái body)
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("success", false);
        errorDetails.put("message",
                "Token không hợp lệ (hết hạn, không đúng định dạng, hoặc không truyền JWT ở header)");
        errorDetails.put("error", ErrorConstants.INVALID_TOKEN);

        // 2. Bọc chi tiết lỗi đó vào class ErrorResponse để cấu trúc JSON output khớp
        // với ResponseBodyAdvice
        ErrorResponse finalResponse = ErrorResponse.builder()
                .success(false)
                .error(errorDetails)
                .timestamp(Instant.now())
                .build();

        // 3. Ghi Final Response ra body
        mapper.writeValue(response.getWriter(), finalResponse);
    }
}
