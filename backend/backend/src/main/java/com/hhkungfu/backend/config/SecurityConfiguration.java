package com.hhkungfu.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

        private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;
        private final JwtAuthenticationConverter jwtAuthenticationConverter;
        // private final OAuth2UserService<?, OAuth2User> oAuth2UserService;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
        private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(org.springframework.security.config.Customizer.withDefaults())
                                .exceptionHandling(e -> e.authenticationEntryPoint(customAuthenticationEntryPoint))
                                .authorizeHttpRequests(authz -> authz
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/v1/animes",
                                                                "/api/v1/animes/**",
                                                                "/api/v1/genres",
                                                                "/api/v1/genres/**",
                                                                "/api/v1/studios",
                                                                "/api/v1/studios/**",
                                                                "/api/v1/files/hls/**",
                                                                "/api/v1/episodes/*/stream-info")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.POST,
                                                                "/api/v1/episodes/*/view")
                                                .permitAll()
                                                .requestMatchers(
                                                                "/api/v1/auth/register",
                                                                "/api/v1/auth/login",
                                                                "/api/v1/auth/verify-email",
                                                                "/api/v1/auth/resend-verification",
                                                                "/api/v1/auth/refresh",
                                                                "/api/v1/auth/forgot-password",
                                                                "/api/v1/auth/reset-password",
                                                                "/api/v1/auth/oauth2/**",
                                                                "/oauth2/**",
                                                                "/login/oauth2/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/v3/api-docs/**")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .oauth2Login(oauth2 -> oauth2
                                                .successHandler(oAuth2LoginSuccessHandler)
                                                .failureHandler(oAuth2LoginFailureHandler))
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

                return http.build();
        }
}
