package com.hhkungfu.backend.module.subscription.dto;

import com.hhkungfu.backend.module.subscription.enums.PaymentGateway;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PendingPaymentDto {
    private Long planId;
    private String planName;
    private PaymentGateway gateway;
    private BigDecimal amount;
    private String orderCode;
    private int expiresIn;
}
