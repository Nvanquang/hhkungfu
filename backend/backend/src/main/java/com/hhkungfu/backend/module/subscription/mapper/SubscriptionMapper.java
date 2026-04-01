package com.hhkungfu.backend.module.subscription.mapper;

import com.hhkungfu.backend.module.subscription.dto.SubscriptionPlanDto;
import com.hhkungfu.backend.module.subscription.dto.SubscriptionPlanRequestDto;
import com.hhkungfu.backend.module.subscription.dto.UserSubscriptionDto;
import com.hhkungfu.backend.module.subscription.entity.SubscriptionPlan;
import com.hhkungfu.backend.module.subscription.entity.UserSubscription;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.ZonedDateTime;

@Mapper(componentModel = "spring")
public interface SubscriptionMapper {

    @Mapping(target = "savingPercent", source = "plan", qualifiedByName = "calculateSavingPercent")
    SubscriptionPlanDto toPlanDto(SubscriptionPlan plan);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    SubscriptionPlan toEntity(SubscriptionPlanRequestDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDto(SubscriptionPlanRequestDto dto, @MappingTarget SubscriptionPlan entity);

    @Mapping(target = "planName", source = "plan.name")
    @Mapping(target = "daysRemaining", source = "expiresAt", qualifiedByName = "calculateDaysRemaining")
    UserSubscriptionDto toUserSubDto(UserSubscription subscription);

    @Named("calculateSavingPercent")
    default Integer calculateSavingPercent(SubscriptionPlan plan) {
        if (plan.getOriginalPrice() == null || plan.getOriginalPrice().compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        BigDecimal discount = plan.getOriginalPrice().subtract(plan.getPrice());
        return discount.multiply(new BigDecimal(100))
                .divide(plan.getOriginalPrice(), 0, RoundingMode.HALF_UP)
                .intValue();
    }

    @Named("calculateDaysRemaining")
    default Long calculateDaysRemaining(ZonedDateTime expiresAt) {
        if (expiresAt == null) return null;
        long days = Duration.between(ZonedDateTime.now(), expiresAt).toDays();
        return Math.max(0, days);
    }
}
