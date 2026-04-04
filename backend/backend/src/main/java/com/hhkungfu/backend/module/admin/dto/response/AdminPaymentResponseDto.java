package com.hhkungfu.backend.module.admin.dto.response;

import com.hhkungfu.backend.module.subscription.enums.PaymentGateway;
import com.hhkungfu.backend.module.subscription.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminPaymentResponseDto {
    private String orderId;
    private UserBriefDto user;
    private String planName;
    private BigDecimal amount;
    private PaymentGateway gateway;
    private PaymentStatus status;
    private ZonedDateTime createdAt;

    @Data
    @Builder
    public static class UserBriefDto {
        private UUID id;
        private String username;
        private String email;
    }
}
