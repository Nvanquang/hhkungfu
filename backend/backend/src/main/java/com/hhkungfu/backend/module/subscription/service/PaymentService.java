package com.hhkungfu.backend.module.subscription.service;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.subscription.dto.PaymentResultDto;
import com.hhkungfu.backend.module.subscription.entity.Payment;
import com.hhkungfu.backend.module.subscription.entity.UserSubscription;
import com.hhkungfu.backend.module.subscription.enums.PaymentStatus;
import com.hhkungfu.backend.module.subscription.enums.SubscriptionStatus;
import com.hhkungfu.backend.module.subscription.enums.SubscriptionType;
import com.hhkungfu.backend.module.subscription.repository.PaymentRepository;
import com.hhkungfu.backend.module.subscription.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

import com.hhkungfu.backend.common.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final VNPayService vnpayService;
    private final MoMoService momoService;
    private final SubscriptionService subscriptionService;
    private final PaymentNotificationService paymentNotificationService;

    @Transactional
    public void processVNPayIPN(Map<String, String> params) {
        if (!vnpayService.verifySignature(params)) {
            throw new BusinessException("Chữ ký không hợp lệ", "PAYMENT", ErrorConstants.PAYMENT_INVALID_SIGNATURE.getCode());
        }

        String orderCode = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        BigDecimal amount = new BigDecimal(params.get("vnp_Amount")).divide(new BigDecimal(100));

        processCallback(orderCode, amount, responseCode.equals("00"), params.get("vnp_TransactionNo"), responseCode,
                params);
    }

    @Transactional
    public void processMoMoIPN(Map<String, String> params) {
        String orderCode = params.get("orderId");
        String requestId = params.get("requestId");
        String resultCode = params.get("resultCode");

        if (!momoService.verifySignature(params)) {
            log.warn("MoMo HMAC signature mismatch for order: {}. Falling back to Server Query...", orderCode);
            Map<String, Object> moMoStatus = momoService.checkTransactionStatus(orderCode, requestId);
            if (moMoStatus == null || !String.valueOf(moMoStatus.get("resultCode")).equals("0")) {
                throw new BusinessException("Chữ ký không hợp lệ và MoMo xác nhận giao dịch không thành công",
                        "PAYMENT", ErrorConstants.PAYMENT_INVALID_SIGNATURE.getCode());
            }
            log.info("MoMo Server confirmed payment successful for order: {}", orderCode);
        }

        BigDecimal amount = new BigDecimal(params.get("amount"));

        processCallback(orderCode, amount, resultCode.equals("0"), params.get("transId"), resultCode, params);
    }

    private void processCallback(String orderCode, BigDecimal amount, boolean isSuccess, String gatewayTxId,
            String responseCode, Map<String, String> rawData) {
        Map<String, Object> rawDataAsObjects = new HashMap<>(rawData);
        // Idempotency: SELECT FOR UPDATE
        Payment payment = paymentRepository.findByOrderCodeWithLock(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thanh toán", "PAYMENT", ErrorConstants.PAYMENT_NOT_FOUND.getCode()));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            log.info("Payment {} already processed or not pending (status: {})", orderCode, payment.getStatus());
            return;
        }

        // Amount verification
        if (payment.getAmount().compareTo(amount) != 0) {
            log.error("Amount mismatch for payment {}: expected {}, received {}", orderCode, payment.getAmount(),
                    amount);
            payment.setStatus(PaymentStatus.FAILED);
            payment.setGatewayResponseCode(responseCode);
            payment.setGatewayResponseData(rawDataAsObjects);
            paymentRepository.save(payment);
            throw new BusinessException("Số tiền thanh toán không khớp", "PAYMENT", ErrorConstants.PAYMENT_AMOUNT_MISMATCH.getCode());
        }

        payment.setGatewayTransactionId(gatewayTxId);
        payment.setGatewayResponseCode(responseCode);
        payment.setGatewayResponseData(rawDataAsObjects);

        if (isSuccess) {
            activateSubscription(payment);
        } else {
            failPayment(payment);
        }
    }

    private void activateSubscription(Payment payment) {
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(ZonedDateTime.now());
        paymentRepository.save(payment);

        UserSubscription sub = payment.getSubscription();
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setStartedAt(ZonedDateTime.now());

        SubscriptionType type = sub.getType() != null ? sub.getType() : SubscriptionType.NEW;

        switch (type) {
            case UPGRADE:
                if (sub.getPreviousSubscriptionId() != null) {
                    UserSubscription prevSub = userSubscriptionRepository.findById(sub.getPreviousSubscriptionId())
                            .orElse(null);
                    if (prevSub != null) {
                        prevSub.setStatus(SubscriptionStatus.EXPIRED);
                        userSubscriptionRepository.save(prevSub);
                    }
                }
                sub.setExpiresAt(ZonedDateTime.now().plusDays(sub.getDurationDays()));
                break;
            case RENEW:
                ZonedDateTime expiryStart = ZonedDateTime.now();
                if (sub.getPreviousSubscriptionId() != null) {
                    UserSubscription prevSub = userSubscriptionRepository.findById(sub.getPreviousSubscriptionId())
                            .orElse(null);
                    // Cộng dồn thời hạn kể cả gói trước đã bị CANCELLED nhưng chưa hết hạn
                    boolean prevStillValid = prevSub != null
                            && prevSub.getExpiresAt() != null
                            && prevSub.getExpiresAt().isAfter(ZonedDateTime.now())
                            && (prevSub.getStatus() == SubscriptionStatus.ACTIVE
                                    || prevSub.getStatus() == SubscriptionStatus.CANCELLED);
                    if (prevStillValid) {
                        expiryStart = prevSub.getExpiresAt();
                        log.info("Accumulating remaining duration from previous subscription {} (status={}, expiresAt={})",
                                prevSub.getId(), prevSub.getStatus(), prevSub.getExpiresAt());
                    }
                }
                sub.setExpiresAt(expiryStart.plusDays(sub.getDurationDays()));
                break;
            case NEW:
            default:
                sub.setExpiresAt(ZonedDateTime.now().plusDays(sub.getDurationDays()));
                break;
        }

        userSubscriptionRepository.save(sub);

        subscriptionService.clearVipCache(payment.getUser().getId());
        log.info("Subscription activated for user {}", payment.getUser().getId());
        paymentNotificationService.notifyPaymentResult(
                payment.getOrderCode(),
                PaymentStatus.PAID.name(),
                sub.getPlan() != null ? sub.getPlan().getName() : null);
    }

    private void failPayment(Payment payment) {
        payment.setStatus(PaymentStatus.FAILED);
        paymentRepository.save(payment);

        UserSubscription sub = payment.getSubscription();
        sub.setStatus(SubscriptionStatus.CANCELLED);
        userSubscriptionRepository.save(sub);
        log.info("Payment failed for order {}", payment.getOrderCode());
        paymentNotificationService.notifyPaymentResult(
                payment.getOrderCode(),
                PaymentStatus.FAILED.name(),
                sub != null && sub.getPlan() != null ? sub.getPlan().getName() : null);
    }

    /**
     * Marks a MoMo payment as FAILED directly from the return URL callback.
     * This bypasses signature verification because:
     * - MoMo return URLs are browser redirects, not IPN server calls.
     * - We only transition PENDING → FAILED (never activate anything), so it's
     * safe.
     * - This ensures FE can always query the correct status by orderId after user
     * cancels.
     */
    @Transactional
    public void markMoMoPaymentFailed(String orderCode, String resultCode, Map<String, String> rawData) {
        paymentRepository.findByOrderCode(orderCode).ifPresent(payment -> {
            if (payment.getStatus() != PaymentStatus.PENDING) {
                log.info("Payment {} already processed (status: {}), skipping markFailed", orderCode,
                        payment.getStatus());
                return;
            }
            Map<String, Object> rawDataAsObjects = new HashMap<>(rawData);
            payment.setStatus(PaymentStatus.FAILED);
            payment.setGatewayResponseCode(resultCode);
            payment.setGatewayResponseData(rawDataAsObjects);
            paymentRepository.save(payment);

            UserSubscription sub = payment.getSubscription();
            if (sub != null && sub.getStatus() == SubscriptionStatus.PENDING) {
                sub.setStatus(SubscriptionStatus.CANCELLED);
                userSubscriptionRepository.save(sub);
            }
            log.info("MoMo payment {} marked as FAILED via return URL (resultCode={})", orderCode, resultCode);
            paymentNotificationService.notifyPaymentResult(
                    orderCode,
                    PaymentStatus.FAILED.name(),
                    sub != null && sub.getPlan() != null ? sub.getPlan().getName() : null);
        });
    }

    @Transactional
    public PaymentResultDto getPaymentResult(String orderCode) {
        Payment payment = paymentRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thanh toán", "PAYMENT", ErrorConstants.PAYMENT_NOT_FOUND.getCode()));

        if (payment.getStatus() == PaymentStatus.PENDING
                && payment.getGateway() == com.hhkungfu.backend.module.subscription.enums.PaymentGateway.MOMO) {
            Map<String, Object> moMoStatus = momoService.checkTransactionStatus(orderCode,
                    java.util.UUID.randomUUID().toString());
            if (moMoStatus != null && moMoStatus.containsKey("resultCode")) {
                String resultCode = String.valueOf(moMoStatus.get("resultCode"));
                if ("0".equals(resultCode)) {
                    BigDecimal amount = new BigDecimal(String.valueOf(moMoStatus.get("amount")));
                    String transId = String.valueOf(moMoStatus.get("transId"));
                    Map<String, String> rawData = new HashMap<>();
                    moMoStatus.forEach((k, v) -> rawData.put(k, String.valueOf(v)));
                    processCallback(orderCode, amount, true, transId, "0", rawData);
                    // Refresh from DB after processing
                    payment = paymentRepository.findByOrderCode(orderCode).get();
                } else if (!"1000".equals(resultCode)) {
                    failPayment(payment);
                }
            }
        }

        return PaymentResultDto.builder()
                .orderId(payment.getOrderCode())
                .status(payment.getStatus())
                .planName(payment.getSubscription().getPlan().getName())
                .amount(payment.getAmount())
                .paidAt(payment.getPaidAt())
                .expiresAt(payment.getSubscription().getExpiresAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResultDto> getHistory(java.util.UUID userId, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Payment> paymentPage = paymentRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);

        java.util.List<PaymentResultDto> items = paymentPage.getContent().stream()
                .map(payment -> PaymentResultDto.builder()
                        .orderId(payment.getOrderCode())
                        .status(payment.getStatus())
                        .planName(payment.getSubscription() != null && payment.getSubscription().getPlan() != null
                                ? payment.getSubscription().getPlan().getName()
                                : "Khác")
                        .amount(payment.getAmount())
                        .paidAt(payment.getPaidAt())
                        .expiresAt(payment.getSubscription() != null ? payment.getSubscription().getExpiresAt() : null)
                        .createdAt(payment.getCreatedAt())
                        .build())
                .toList();

        return PageResponse.<PaymentResultDto>builder()
                .items(items)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(page)
                        .limit(limit)
                        .total(paymentPage.getTotalElements())
                        .totalPages(paymentPage.getTotalPages())
                        .build())
                .build();
    }
}
