package com.hhkungfu.backend.module.subscription.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InitiatePaymentResponse {
    private String paymentUrl;
    private String orderId;
    private Integer expiresIn; // seconds
}
