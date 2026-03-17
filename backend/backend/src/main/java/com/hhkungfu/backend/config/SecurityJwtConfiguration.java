package com.hhkungfu.backend.config;

import com.hhkungfu.backend.common.util.SecurityUtil;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.Jwt;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class SecurityJwtConfiguration {

    @Value("${security.authentication.jwt.base64-secret}")
    private String jwtKey;

    @Bean
    public JwtDecoder jwtDecoder(StringRedisTemplate redisTemplate) {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withSecretKey(getSecretKey())
                .macAlgorithm(SecurityUtil.JWT_ALGORITHM).build();

        OAuth2TokenValidator<Jwt> defaultValidator = JwtValidators.createDefault();
        OAuth2TokenValidator<Jwt> logoutValidator = token -> {
            String userIdStr = token.getSubject();
            if (userIdStr != null) {
                String logoutTimeStr = redisTemplate.opsForValue().get(com.hhkungfu.backend.common.constant.RedisKeys.userLogout(userIdStr));
                if (logoutTimeStr != null) {
                    long logoutTime = Long.parseLong(logoutTimeStr);
                    if (token.getIssuedAt() != null && token.getIssuedAt().toEpochMilli() <= logoutTime) {
                        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Token has been revoked", null));
                    }
                }
            }
            return OAuth2TokenValidatorResult.success();
        };

        jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(defaultValidator, logoutValidator));

        return token -> {
            try {
                return jwtDecoder.decode(token);
            } catch (Exception e) {
                System.out.println(">>> JWT error: " + e.getMessage());
                throw e;
            }
        };
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(getSecretKey()));
    }

    private SecretKey getSecretKey() {
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return new SecretKeySpec(keyBytes, 0, keyBytes.length, SecurityUtil.JWT_ALGORITHM.getName());
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = jwt.getClaimAsString("role");

            List<GrantedAuthority> authorities = new ArrayList<>();
            if (role != null) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
            }

            return authorities;
        });

        return converter;
    }
}
