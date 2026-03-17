package com.hhkungfu.backend.config;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;
    private final StringRedisTemplate redisTemplate;

    @Value("${spring.application.client-app-url:http://localhost:5173}")
    private String clientAppUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid authentication type");
            return;
        }

        OAuth2User oAuth2User = oauthToken.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");

        if (email == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Email not found from provider");
            return;
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found after OAuth2 login"));

        String accessToken = securityUtil.createAccessToken(user);
        String refreshToken = securityUtil.createRefreshToken(user);

        redisTemplate.opsForValue().set("refresh:" + user.getId(), refreshToken, Duration.ofDays(7));

        org.springframework.http.ResponseCookie refreshTokenCookie = org.springframework.http.ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .sameSite("Strict")
                .maxAge(604800)
                .build();
        response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

        String encodedToken = URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
        String redirectUrl = clientAppUrl + "/oauth-success#token=" + encodedToken;

        response.sendRedirect(redirectUrl);
    }
}
