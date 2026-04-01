package com.hhkungfu.backend.module.subscription.dto;

import com.hhkungfu.backend.module.subscription.enums.PaymentStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResultDto {
    private String orderId;
    private PaymentStatus status;
    private String planName;
    private BigDecimal amount;
    private ZonedDateTime paidAt;
    private ZonedDateTime expiresAt;
    private ZonedDateTime createdAt;
}
