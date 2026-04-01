package com.hhkungfu.backend.module.subscription.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanDto {
    private Long id;
    private String name;
    private Integer durationDays;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer savingPercent;
    private String description;
    private List<String> features;
    private boolean isActive;
    private int sortOrder;
}
