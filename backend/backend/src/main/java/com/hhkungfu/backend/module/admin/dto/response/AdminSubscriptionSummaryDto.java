package com.hhkungfu.backend.module.admin.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminSubscriptionSummaryDto {
    private BigDecimal monthlyRevenue;
    private double revenueDelta;
    private int successRate;
    private long successOrderCount;
    private long totalOrderCount;
}
