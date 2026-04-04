package com.hhkungfu.backend.module.admin.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.admin.dto.response.AdminPaymentResponseDto;
import com.hhkungfu.backend.module.admin.dto.response.AdminSubscriptionSummaryDto;
import com.hhkungfu.backend.module.admin.dto.response.AdminVipMemberResponseDto;
import com.hhkungfu.backend.module.subscription.dto.SubscriptionPlanDto;
import com.hhkungfu.backend.module.subscription.dto.SubscriptionPlanRequestDto;
import com.hhkungfu.backend.module.subscription.service.SubscriptionService;
import com.hhkungfu.backend.module.subscription.mapper.SubscriptionMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Admin Subscription", description = "Admin subscription management APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionMapper subscriptionMapper;

    @GetMapping("/summary")
    @ApiMessage("Subscription summary loaded successfully")
    @Operation(summary = "Get overall subscription metrics")
    public ResponseEntity<AdminSubscriptionSummaryDto> getSummary() {
        return ResponseEntity.ok(subscriptionService.getSummary());
    }

    @GetMapping("/payments")
    @ApiMessage("Payments loaded successfully")
    @Operation(summary = "Get paginated payment history")
    public ResponseEntity<PageResponse<AdminPaymentResponseDto>> getPayments(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "gateway", required = false) String gateway,
            @RequestParam(name = "status", required = false) String status) {

        Pageable pageable = PageRequest.of(Math.max(0, page - 1), limit, Sort.by("id").descending());
        return ResponseEntity.ok(subscriptionService.getPayments(pageable, search, gateway, status));
    }

    @GetMapping("/vips")
    @ApiMessage("VIP members loaded successfully")
    @Operation(summary = "Get paginated VIP members list")
    public ResponseEntity<PageResponse<AdminVipMemberResponseDto>> getVipMembers(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "planId", required = false) Long planId,
            @RequestParam(name = "status", required = false) String status) {

        Pageable pageable = PageRequest.of(Math.max(0, page - 1), limit, Sort.by("id").descending());
        return ResponseEntity.ok(subscriptionService.getVipMembers(pageable, search, planId, status));
    }

    @GetMapping("/plans")
    @ApiMessage("Plans loaded successfully")
    @Operation(summary = "Get all subscription plans for admin")
    public ResponseEntity<List<SubscriptionPlanDto>> getPlans() {
        return ResponseEntity.ok(subscriptionService.getAllPlans()
                .stream()
                .map(subscriptionMapper::toPlanDto)
                .collect(Collectors.toList()));
    }

    @PostMapping("/plans")
    @ApiMessage("Plan created successfully")
    @Operation(summary = "Create a new subscription plan")
    public ResponseEntity<SubscriptionPlanDto> createPlan(@Valid @RequestBody SubscriptionPlanRequestDto request) {
        return ResponseEntity.ok(subscriptionMapper.toPlanDto(subscriptionService.createPlan(request)));
    }

    @PutMapping("/plans/{id}")
    @ApiMessage("Plan updated successfully")
    @Operation(summary = "Update an existing subscription plan")
    public ResponseEntity<SubscriptionPlanDto> updatePlan(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody SubscriptionPlanRequestDto request) {
        return ResponseEntity.ok(subscriptionMapper.toPlanDto(subscriptionService.updatePlan(id, request)));
    }

    @PatchMapping("/plans/{id}/toggle")
    @ApiMessage("Plan status toggled successfully")
    @Operation(summary = "Toggle plan active status")
    public ResponseEntity<Void> togglePlan(@PathVariable(name = "id") Long id) {
        subscriptionService.togglePlan(id);
        return ResponseEntity.ok().build();
    }
}
