package com.hhkungfu.backend.common.response;

import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import jakarta.servlet.http.HttpServletResponse;

import com.hhkungfu.backend.common.annotation.ApiMessage;

@RestControllerAdvice
public class CustomResponseBodyAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        try {
            String path = ((org.springframework.web.context.request.ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                    .getRequest()
                    .getRequestURI();

            return !(path.startsWith("/v3/api-docs") ||
                    path.startsWith("/swagger") ||
                    path.startsWith("/swagger-ui") ||
                    path.startsWith("/actuator") ||
                    path.startsWith("/api/v1/files/hls") ||
                    path.startsWith("/error") ||
                    path.contains("api-docs"));
        } catch (Exception e) {
            return true;
        }
    }

    @Override
    public Object beforeBodyWrite(Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {

        HttpServletResponse httpResponse = ((ServletServerHttpResponse) response).getServletResponse();
        int status = httpResponse.getStatus();

        if (body instanceof byte[] || body instanceof String || body instanceof Resource) {
            return body;
        }

        if (body instanceof ApiResponse || body instanceof ErrorResponse) {
            return body;
        }

        if (selectedContentType != null && !selectedContentType.includes(MediaType.APPLICATION_JSON) && status < 400) {
            return body;
        }

        if (selectedConverterType != null && !org.springframework.http.converter.json.MappingJackson2HttpMessageConverter.class.isAssignableFrom(selectedConverterType)) {
            return body;
        }

        if (status >= 400) {
            return ErrorResponse.builder()
                    .success(false)
                    .error(body)
                    .timestamp(java.time.Instant.now())
                    .build();
        }

        ApiResponse<Object> apiResponse = new ApiResponse<>();
        apiResponse.setSuccess(true);
        apiResponse.setData(body);
        apiResponse.setMessage("CALL API SUCCESS");
        apiResponse.setTimestamp(java.time.Instant.now());

        ApiMessage apiMessage = returnType.getMethodAnnotation(ApiMessage.class);
        if (apiMessage != null) {
            apiResponse.setMessage(apiMessage.value());
        }

        return apiResponse;
    }
}
