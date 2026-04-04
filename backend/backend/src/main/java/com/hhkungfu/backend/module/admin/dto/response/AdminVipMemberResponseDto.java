package com.hhkungfu.backend.module.admin.dto.response;

import com.hhkungfu.backend.module.subscription.enums.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminVipMemberResponseDto {
    private Long id;
    private UserDetailsDto user;
    private String planName;
    private ZonedDateTime expiresAt;
    private long remainingDays;
    private int progress;
    private SubscriptionStatus status;

    @Data
    @Builder
    public static class UserDetailsDto {
        private UUID id;
        private String username;
        private String email;
        private String avatarUrl;
    }
}
