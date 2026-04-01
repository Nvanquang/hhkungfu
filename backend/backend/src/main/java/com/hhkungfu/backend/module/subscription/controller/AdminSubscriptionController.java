package com.hhkungfu.backend.module.subscription.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.subscription.dto.SubscriptionPlanDto;
import com.hhkungfu.backend.module.subscription.dto.SubscriptionPlanRequestDto;
import com.hhkungfu.backend.module.subscription.entity.SubscriptionPlan;
import com.hhkungfu.backend.module.subscription.mapper.SubscriptionMapper;
import com.hhkungfu.backend.module.subscription.repository.SubscriptionPlanRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Admin Subscription", description = "Admin Subscription management APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubscriptionController {

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionMapper subscriptionMapper;

    @PostMapping("/plans")
    @ResponseStatus(HttpStatus.CREATED)
    @ApiMessage("Subscription plan created successfully")
    @Operation(summary = "Create a new subscription plan")
    public SubscriptionPlanDto createPlan(@Valid @RequestBody SubscriptionPlanRequestDto dto) {
        SubscriptionPlan plan = subscriptionMapper.toEntity(dto);
        return subscriptionMapper.toPlanDto(planRepository.save(plan));
    }

    @PutMapping("/plans/{id}")
    @ApiMessage("Subscription plan updated successfully")
    @Operation(summary = "Update an existing subscription plan")
    public SubscriptionPlanDto updatePlan(@PathVariable Long id, @Valid @RequestBody SubscriptionPlanRequestDto dto) {
        SubscriptionPlan plan = planRepository.findById(id).orElseThrow();
        subscriptionMapper.updateEntityFromDto(dto, plan);
        return subscriptionMapper.toPlanDto(planRepository.save(plan));
    }

    @PatchMapping("/plans/{id}/toggle")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiMessage("Subscription plan status toggled successfully")
    @Operation(summary = "Toggle active status of a subscription plan")
    public void togglePlan(@PathVariable(name = "id") Long id) {
        SubscriptionPlan plan = planRepository.findById(id).orElseThrow();
        plan.setActive(!plan.isActive());
        planRepository.save(plan);
    }
}
