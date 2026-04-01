package com.hhkungfu.backend.module.subscription.dto;

import com.hhkungfu.backend.module.subscription.enums.SubscriptionStatus;
import lombok.*;
import java.time.ZonedDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscriptionDto {
    private Long id;
    private String planName;
    private SubscriptionStatus status;
    private ZonedDateTime startedAt;
    private ZonedDateTime expiresAt;
    private Long daysRemaining;
}
