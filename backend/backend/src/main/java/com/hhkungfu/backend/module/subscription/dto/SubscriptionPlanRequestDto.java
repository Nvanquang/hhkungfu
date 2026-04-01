package com.hhkungfu.backend.module.subscription.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanRequestDto {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Duration days is required")
    @PositiveOrZero(message = "Duration days must be positive")
    private Integer durationDays;

    @NotNull(message = "Price is required")
    @PositiveOrZero(message = "Price must be positive or zero")
    private BigDecimal price;

    @PositiveOrZero(message = "Original price must be positive or zero")
    private BigDecimal originalPrice;

    private String description;

    private List<String> features;

    @Builder.Default
    private boolean isActive = true;

    @Builder.Default
    private int sortOrder = 0;
}
