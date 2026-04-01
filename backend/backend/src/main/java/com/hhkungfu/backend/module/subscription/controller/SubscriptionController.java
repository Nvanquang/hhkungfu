package com.hhkungfu.backend.module.subscription.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.subscription.dto.InitiatePaymentRequest;
import com.hhkungfu.backend.module.subscription.dto.InitiatePaymentResponse;
import com.hhkungfu.backend.module.subscription.dto.PendingPaymentDto;
import com.hhkungfu.backend.module.subscription.dto.SubscriptionPlanDto;
import com.hhkungfu.backend.module.subscription.dto.UserSubscriptionDto;
import com.hhkungfu.backend.module.subscription.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscription", description = "Subscription management APIs")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    @ApiMessage("Get subscription plans successfully")
    @Operation(summary = "Get active subscription plans")
    public ResponseEntity<List<SubscriptionPlanDto>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getPlans());
    }

    @GetMapping("/me")
    @ApiMessage("Get my subscription successfully")
    @Operation(summary = "Get current user subscription status")
    public ResponseEntity<UserSubscriptionDto> getMe() {
        UUID userId = UUID.fromString(SecurityUtil.getCurrentUserId().get());
        return ResponseEntity.ok(subscriptionService.getMe(userId));
    }

    @PostMapping("/initiate")
    @ApiMessage("Payment initiated successfully")
    @Operation(summary = "Initiate payment for a subscription plan")
    public ResponseEntity<InitiatePaymentResponse> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            HttpServletRequest servletRequest) {
        UUID userId = UUID.fromString(SecurityUtil.getCurrentUserId().get());
        String ipAddress = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(subscriptionService.initiatePayment(userId, request, ipAddress));
    }

    @PostMapping("/upgrade")
    @ApiMessage("Subscription upgrade initiated successfully")
    @Operation(summary = "Upgrade current subscription plan")
    public ResponseEntity<InitiatePaymentResponse> upgradeSubscription(
            @Valid @RequestBody InitiatePaymentRequest request,
            HttpServletRequest servletRequest) {
        UUID userId = UUID.fromString(SecurityUtil.getCurrentUserId().get());
        String ipAddress = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(subscriptionService.upgrade(userId, request, ipAddress));
    }

    @PostMapping("/cancel")
    @ApiMessage("Subscription cancelled successfully")
    @Operation(summary = "Cancel current active subscription")
    public ResponseEntity<Void> cancelSubscription() {
        UUID userId = UUID.fromString(SecurityUtil.getCurrentUserId().get());
        subscriptionService.cancel(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending")
    @ApiMessage("Get pending payment successfully")
    @Operation(summary = "Get current pending subscription payment")
    public ResponseEntity<PendingPaymentDto> getPendingPayment() {
        UUID userId = UUID.fromString(SecurityUtil.getCurrentUserId().get());
        return ResponseEntity.ok(subscriptionService.getPendingPayment(userId));
    }

    @PostMapping("/pending/cancel")
    @ApiMessage("Pending payment cancelled successfully")
    @Operation(summary = "Cancel current pending subscription payment")
    public ResponseEntity<Void> cancelPendingPayment() {
        UUID userId = UUID.fromString(SecurityUtil.getCurrentUserId().get());
        subscriptionService.cancelPendingPayment(userId);
        return ResponseEntity.ok().build();
    }
}
