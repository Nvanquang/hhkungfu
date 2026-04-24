package com.hhkungfu.backend.module.video.service;

import com.nimbusds.jose.util.Base64;
import com.nimbusds.jose.util.Base64URL;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoTokenService {

    @Value("${security.authentication.jwt.base64-secret}")
    private String secretKey;

    // Token validity in seconds (e.g., 6 hours = 21600)
    private static final long TOKEN_VALIDITY_SECONDS = 21600;

    /**
     * Generates a lightweight HMAC token for video access.
     * Format: {expireTime}.{userIdBase64URL}.{hmac-signature}
     */
    public String generateToken(Long episodeId, String userId) {
        long expireTime = Instant.now().getEpochSecond() + TOKEN_VALIDITY_SECONDS;
        String safeUserId = userId != null ? userId : "anonymous";
        String userIdB64 = Base64URL.encode(safeUserId.getBytes(StandardCharsets.UTF_8)).toString();
        
        String payload = episodeId + ":" + safeUserId + ":" + expireTime;
        String signature = hmacSha256(payload);
        
        return expireTime + "." + userIdB64 + "." + signature;
    }

    /**
     * Validates the video token. Throws SecurityException if invalid.
     */
    public void validateToken(String token, Long episodeId) {
        if (token == null || token.isBlank()) {
            throw new SecurityException("Missing video token");
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new SecurityException("Invalid video token format");
        }

        long expireTime;
        try {
            expireTime = Long.parseLong(parts[0]);
        } catch (NumberFormatException e) {
            throw new SecurityException("Invalid token expiration format");
        }

        if (Instant.now().getEpochSecond() > expireTime) {
            throw new SecurityException("Video token expired");
        }

        String safeUserId;
        try {
            safeUserId = new String(new Base64URL(parts[1]).decode(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new SecurityException("Invalid token user data");
        }

        String expectedPayload = episodeId + ":" + safeUserId + ":" + expireTime;
        String expectedSignature = hmacSha256(expectedPayload);

        if (!expectedSignature.equals(parts[2])) {
            throw new SecurityException("Invalid video token signature");
        }
    }

    private String hmacSha256(String data) {
        try {
            byte[] keyBytes = Base64.from(secretKey).decode();
            SecretKeySpec secretKeySpec = new SecretKeySpec(keyBytes, "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64URL.encode(hash).toString();
        } catch (Exception e) {
            log.error("Failed to generate HMAC", e);
            throw new RuntimeException("Could not generate video token");
        }
    }
}
