package com.hhkungfu.backend.module.subscription.controller;

import com.hhkungfu.backend.common.annotation.ApiMessage;
import com.hhkungfu.backend.module.subscription.dto.PaymentResultDto;
import com.hhkungfu.backend.module.subscription.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.common.exception.AuthException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.response.PageResponse;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment", description = "Payment callback and result APIs")
public class PaymentController {

    private final PaymentService paymentService;

    // VNPay IPN (Server-to-Server)
    @GetMapping("/callback/vnpay/ipn")
    @Operation(summary = "VNPay IPN callback")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        paymentService.processVNPayIPN(params);
        return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
    }

    // MoMo IPN (Server-to-Server)
    @PostMapping("/callback/momo/ipn")
    @Operation(summary = "MoMo IPN callback")
    public ResponseEntity<Void> momoIpn(@RequestBody Map<String, String> params) {
        String orderCode = params.get("orderId");
        boolean isSuccess = "0".equals(String.valueOf(params.get("resultCode")));

        if (isSuccess) {
            try {
                paymentService.processMoMoIPN(params);
            } catch (Exception e) {
                log.warn("Silently catching MoMo IPN sync error: {}", e.getMessage());
            }
        } else {
            try {
                paymentService.markMoMoPaymentFailed(orderCode, params.get("resultCode"), params);
            } catch (Exception e) {
                log.warn("Failed to mark MoMo payment as failed for order {}: {}", orderCode, e.getMessage());
            }
        }

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/result")
    @ApiMessage("Get payment result successfully")
    @Operation(summary = "Poll payment result")
    public ResponseEntity<PaymentResultDto> getResult(@RequestParam(name = "orderCode") String orderCode) {
        return ResponseEntity.ok(paymentService.getPaymentResult(orderCode));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiMessage("Get payment history successfully")
    @Operation(summary = "Get current user payment history")
    public ResponseEntity<PageResponse<PaymentResultDto>> getHistory(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        String userId = SecurityUtil.getCurrentUserId()
                .orElseThrow(() -> new AuthException("Chưa đăng nhập", org.springframework.http.HttpStatus.UNAUTHORIZED,
                        ErrorConstants.UNAUTHORIZED.getCode()));
        return ResponseEntity.ok(paymentService.getHistory(UUID.fromString(userId), page, limit));
    }
}
