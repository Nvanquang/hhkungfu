package com.hhkungfu.backend.module.subscription.dto;

import com.hhkungfu.backend.module.subscription.enums.PaymentGateway;
import jakarta.validation.constraints.NotNull;

public record InitiatePaymentRequest(
    @NotNull Long planId,
    @NotNull PaymentGateway gateway
) {}
