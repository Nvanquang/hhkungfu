package com.hhkungfu.backend.module.subscription.service;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.subscription.dto.*;
import com.hhkungfu.backend.module.subscription.entity.Payment;
import com.hhkungfu.backend.module.subscription.entity.SubscriptionPlan;
import com.hhkungfu.backend.module.subscription.entity.UserSubscription;
import com.hhkungfu.backend.module.subscription.enums.PaymentGateway;
import com.hhkungfu.backend.module.subscription.enums.PaymentStatus;
import com.hhkungfu.backend.module.subscription.enums.SubscriptionStatus;
import com.hhkungfu.backend.module.subscription.enums.SubscriptionType;
import com.hhkungfu.backend.module.subscription.mapper.SubscriptionMapper;
import com.hhkungfu.backend.module.subscription.repository.PaymentRepository;
import com.hhkungfu.backend.module.subscription.repository.SubscriptionPlanRepository;
import com.hhkungfu.backend.module.subscription.repository.UserSubscriptionRepository;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

        private final SubscriptionPlanRepository planRepository;
        private final UserSubscriptionRepository userSubscriptionRepository;
        private final PaymentRepository paymentRepository;
        private final UserRepository userRepository;
        private final SubscriptionMapper subscriptionMapper;
        private final RedisTemplate<String, Object> redisTemplate;
        private final VNPayService vnpayService;
        private final MoMoService momoService;

        private static final String VIP_CACHE_PREFIX = "vip:status:";

        @Transactional(readOnly = true)
        public List<SubscriptionPlanDto> getPlans() {
                return planRepository.findAllByIsActiveTrueOrderBySortOrderAsc()
                                .stream()
                                .map(subscriptionMapper::toPlanDto)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public UserSubscriptionDto getMe(UUID userId) {
                return userSubscriptionRepository.findLatestActiveSubscription(userId, ZonedDateTime.now())
                                .map(subscriptionMapper::toUserSubDto)
                                .orElse(null);
        }

        @Transactional
        public InitiatePaymentResponse initiatePayment(UUID userId, InitiatePaymentRequest request, String ipAddress) {
                User user = getValidUser(userId);
                SubscriptionPlan plan = getValidPlan(request.planId());

                Payment paymentToReuse = handlePendingOrders(user, plan, request.gateway());
                if (paymentToReuse != null) {
                        return regeneratePaymentUrl(paymentToReuse, plan, request.gateway(), ipAddress);
                }

                // Renewal / Re-subscribe Logic
                // Dùng findLatestEffectiveSubscription để tìm gói còn hiệu lực kể cả đã bị
                // CANCELLED
                // Đảm bảo cộng dồn thời hạn thay vì reset nếu chưa hết hạn.
                Optional<UserSubscription> effectiveSub = userSubscriptionRepository.findLatestEffectiveSubscription(
                                userId,
                                ZonedDateTime.now());

                if (effectiveSub.isPresent()) {
                        UserSubscription currentSub = effectiveSub.get();

                        // Chỉ kiểm tra chặn chuyển gói / giới hạn 5 ngày khi gói vẫn đang ACTIVE
                        if (currentSub.getStatus() == SubscriptionStatus.ACTIVE) {
                                if (!currentSub.getPlan().getId().equals(plan.getId())) {
                                        throw new BusinessException(
                                                        "Vui lòng sử dụng chức năng nâng cấp để chuyển đổi gói",
                                                        "SUBSCRIPTION",
                                                        ErrorConstants.SUBSCRIPTION_MUST_UPGRADE.getCode());
                                }

                                long remainingDays = Math.max(0,
                                                Duration.between(ZonedDateTime.now(), currentSub.getExpiresAt())
                                                                .toDays());
                                if (remainingDays > 5) {
                                        throw new BusinessException(
                                                        "Chỉ có thể gia hạn khi gói hiện tại còn 5 ngày hoặc ít hơn",
                                                        "SUBSCRIPTION",
                                                        ErrorConstants.SUBSCRIPTION_RENEW_NOT_ALLOWED.getCode());
                                }
                        }
                        // Nếu gói đã bị CANCELLED nhưng vẫn còn hiệu lực:
                        // → User được đăng ký lại cùng gói hoặc gói khác tự do
                        // → Thời hạn còn lại sẽ được cộng dồn vào gói mới (xử lý trong activateSubscription)
                }

                UserSubscription subscription = UserSubscription.builder()
                                .user(user)
                                .plan(plan)
                                .status(SubscriptionStatus.PENDING)
                                .type(effectiveSub.isPresent() ? SubscriptionType.RENEW : SubscriptionType.NEW)
                                .paidPrice(plan.getPrice())
                                .durationDays(plan.getDurationDays())
                                .previousSubscriptionId(effectiveSub.map(UserSubscription::getId).orElse(null))
                                .build();

                userSubscriptionRepository.save(subscription);

                return createNewPayment(user, subscription, plan, request.gateway(), ipAddress, false);
        }

        @Transactional
        public InitiatePaymentResponse upgrade(UUID userId, InitiatePaymentRequest request, String ipAddress) {
                User user = getValidUser(userId);
                SubscriptionPlan newPlan = getValidPlan(request.planId());

                Payment paymentToReuse = handlePendingOrders(user, newPlan, request.gateway());
                if (paymentToReuse != null) {
                        return regeneratePaymentUrl(paymentToReuse, newPlan, request.gateway(), ipAddress);
                }

                UserSubscription oldSub = userSubscriptionRepository
                                .findLatestActiveSubscription(userId, ZonedDateTime.now())
                                .orElseThrow(() -> new BusinessException(
                                                "Không có gói đăng ký nào đang hoạt động để nâng cấp",
                                                "SUBSCRIPTION",
                                                ErrorConstants.NO_ACTIVE_SUBSCRIPTION.getCode()));

                SubscriptionPlan oldPlan = oldSub.getPlan();

                if (newPlan.getPrice().compareTo(oldPlan.getPrice()) <= 0) {
                        throw new BusinessException("Không thể nâng cấp sang gói rẻ hơn hoặc cùng giá", "PLAN",
                                        ErrorConstants.PLAN_CANNOT_DOWNGRADE.getCode());
                }

                long remainingDays = Math.max(0, Duration.between(ZonedDateTime.now(), oldSub.getExpiresAt()).toDays());

                BigDecimal oldPricePerDay = oldPlan.getPrice()
                                .divide(new BigDecimal(oldPlan.getDurationDays()), 4,
                                                RoundingMode.HALF_UP);
                BigDecimal newPricePerDay = newPlan.getPrice()
                                .divide(new BigDecimal(newPlan.getDurationDays()), 4,
                                                RoundingMode.HALF_UP);

                BigDecimal remainingValue = oldPricePerDay.multiply(new BigDecimal(remainingDays));
                int convertedDays = remainingValue.divide(newPricePerDay, 0, java.math.RoundingMode.FLOOR).intValue();

                int totalDurationDays = newPlan.getDurationDays() + convertedDays;

                UserSubscription subscription = UserSubscription.builder()
                                .user(user)
                                .plan(newPlan)
                                .status(SubscriptionStatus.PENDING)
                                .type(SubscriptionType.UPGRADE)
                                .paidPrice(newPlan.getPrice())
                                .durationDays(totalDurationDays)
                                .previousSubscriptionId(oldSub.getId())
                                .build();

                userSubscriptionRepository.save(subscription);

                return createNewPayment(user, subscription, newPlan, request.gateway(), ipAddress, true);
        }

        @Transactional
        public void cancel(UUID userId) {
                if (userSubscriptionRepository.existsByUserIdAndStatus(userId, SubscriptionStatus.PENDING)) {
                        throw new BusinessException("Không thể hủy khi đang có đăng ký chờ xử lý", "SUBSCRIPTION",
                                        ErrorConstants.SUBSCRIPTION_CANNOT_CANCEL_PENDING.getCode());
                }

                UserSubscription activeSub = userSubscriptionRepository
                                .findLatestActiveSubscription(userId, ZonedDateTime.now())
                                .orElseThrow(
                                                () -> new BusinessException(
                                                                "Không có gói đăng ký nào đang hoạt động để hủy",
                                                                "SUBSCRIPTION",
                                                                ErrorConstants.NO_ACTIVE_SUBSCRIPTION.getCode()));

                activeSub.setStatus(SubscriptionStatus.CANCELLED);
                userSubscriptionRepository.save(activeSub);
                clearVipCache(userId);
        }

        @Transactional
        public PendingPaymentDto getPendingPayment(UUID userId) {
                List<Payment> pendingPayments = paymentRepository.findAllByUserIdAndStatusWithLock(userId,
                                PaymentStatus.PENDING);
                for (Payment p : pendingPayments) {
                        boolean isExpired = p.getExpiredAt() != null && p.getExpiredAt().isBefore(ZonedDateTime.now());
                        if (isExpired) {
                                p.setStatus(PaymentStatus.EXPIRED);
                                UserSubscription sub = p.getSubscription();
                                if (sub != null && sub.getStatus() == SubscriptionStatus.PENDING) {
                                        sub.setStatus(SubscriptionStatus.CANCELLED);
                                        userSubscriptionRepository.save(sub);
                                }
                                paymentRepository.save(p);
                        } else {
                                return PendingPaymentDto.builder()
                                                .planId(p.getSubscription().getPlan().getId())
                                                .planName(p.getSubscription().getPlan().getName())
                                                .gateway(p.getGateway())
                                                .amount(p.getAmount())
                                                .orderCode(p.getOrderCode())
                                                .expiresIn((int) Math.max(0,
                                                                Duration.between(ZonedDateTime.now(), p.getExpiredAt())
                                                                                .getSeconds()))
                                                .build();
                        }
                }
                return null;
        }

        @Transactional
        public void cancelPendingPayment(UUID userId) {
                List<Payment> pendingPayments = paymentRepository.findAllByUserIdAndStatusWithLock(userId,
                                PaymentStatus.PENDING);
                for (Payment p : pendingPayments) {
                        p.setStatus(PaymentStatus.CANCELLED);
                        UserSubscription sub = p.getSubscription();
                        if (sub != null && sub.getStatus() == SubscriptionStatus.PENDING) {
                                sub.setStatus(SubscriptionStatus.CANCELLED);
                                userSubscriptionRepository.save(sub);
                        }
                        paymentRepository.save(p);
                }
        }

        public boolean isVipActive(UUID userId) {
                String cacheKey = VIP_CACHE_PREFIX + userId;
                Boolean isVip = (Boolean) redisTemplate.opsForValue().get(cacheKey);

                if (isVip != null) {
                        return isVip;
                }

                boolean active = userSubscriptionRepository.findLatestActiveSubscription(userId, ZonedDateTime.now())
                                .isPresent();
                redisTemplate.opsForValue().set(cacheKey, active, Duration.ofMinutes(5));
                return active;
        }

        public void clearVipCache(UUID userId) {
                redisTemplate.delete(VIP_CACHE_PREFIX + userId);
        }

        private User getValidUser(UUID userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng", "USER",
                                                ErrorConstants.USER_NOT_FOUND.getCode()));
                if (!user.isEmailVerified()) {
                        throw new BusinessException("Email chưa được xác thực", "SUBSCRIPTION",
                                        ErrorConstants.EMAIL_NOT_VERIFIED.getCode());
                }
                return user;
        }

        private SubscriptionPlan getValidPlan(Long planId) {
                SubscriptionPlan plan = planRepository.findById(planId)
                                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói đăng ký", "PLAN",
                                                ErrorConstants.PLAN_NOT_FOUND.getCode()));
                if (!plan.isActive()) {
                        throw new BusinessException("Gói đăng ký không hoạt động", "PLAN",
                                        ErrorConstants.PLAN_NOT_ACTIVE.getCode());
                }
                return plan;
        }

        private Payment handlePendingOrders(User user, SubscriptionPlan requestedPlan,
                        com.hhkungfu.backend.module.subscription.enums.PaymentGateway requestedGateway) {
                // LOCK/DB constraint: use pessimistic write lock to fetch pending payments,
                // guaranteeing 1 pending execution path at a time
                List<Payment> pendingPayments = paymentRepository.findAllByUserIdAndStatusWithLock(user.getId(),
                                PaymentStatus.PENDING);
                Payment paymentToReuse = null;

                for (Payment p : pendingPayments) {
                        boolean isExpired = p.getExpiredAt() != null && p.getExpiredAt().isBefore(ZonedDateTime.now());

                        if (isExpired) {
                                p.setStatus(PaymentStatus.EXPIRED);
                                UserSubscription sub = p.getSubscription();
                                if (sub != null && sub.getStatus() == SubscriptionStatus.PENDING) {
                                        sub.setStatus(SubscriptionStatus.CANCELLED);
                                        userSubscriptionRepository.save(sub);
                                }
                                paymentRepository.save(p);
                        } else {
                                boolean isSamePlan = p.getSubscription() != null
                                                && p.getSubscription().getPlan().getId().equals(requestedPlan.getId());
                                boolean isSameAmount = p.getAmount().compareTo(requestedPlan.getPrice()) == 0;
                                boolean isSameGateway = p.getGateway() == requestedGateway;

                                if (isSamePlan && isSameAmount && isSameGateway && paymentToReuse == null) {
                                        paymentToReuse = p;
                                } else {
                                        p.setStatus(PaymentStatus.CANCELLED);
                                        UserSubscription sub = p.getSubscription();
                                        if (sub != null && sub.getStatus() == SubscriptionStatus.PENDING) {
                                                sub.setStatus(SubscriptionStatus.CANCELLED);
                                                userSubscriptionRepository.save(sub);
                                        }
                                        paymentRepository.save(p);
                                }
                        }
                }
                return paymentToReuse;
        }

        private InitiatePaymentResponse createNewPayment(User user, UserSubscription subscription,
                        SubscriptionPlan plan, PaymentGateway gateway,
                        String ipAddress, boolean isUpgrade) {
                String orderCode = "ORD" + System.currentTimeMillis()
                                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                orderCode = orderCode.replaceAll("[^a-zA-Z0-9]", "");

                String orderInfo = (isUpgrade ? "Upgrade VIP: " : "Purchase VIP: ") + plan.getName() + " - "
                                + user.getUsername();

                Payment payment = Payment.builder()
                                .subscription(subscription)
                                .user(user)
                                .gateway(gateway)
                                .amount(plan.getPrice())
                                .status(PaymentStatus.PENDING)
                                .orderCode(orderCode)
                                .orderInfo(orderInfo)
                                .expiredAt(ZonedDateTime.now().plusMinutes(15))
                                .build();

                paymentRepository.save(payment);

                // Generate URL and cache it for MoMo (MoMo rejects duplicate orderId on
                // re-call)
                InitiatePaymentResponse response = regeneratePaymentUrl(payment, plan, gateway, ipAddress);
                if (gateway == PaymentGateway.MOMO) {
                        payment.setGatewayResponseData(Map.of("cachedPayUrl", response.getPaymentUrl()));
                        paymentRepository.save(payment);
                }
                return response;
        }

        private InitiatePaymentResponse regeneratePaymentUrl(Payment payment, SubscriptionPlan plan,
                        PaymentGateway gateway, String ipAddress) {
                String paymentUrl;
                switch (gateway) {
                        case VNPAY -> paymentUrl = vnpayService.createPaymentUrl(payment.getOrderCode(),
                                        plan.getPrice().longValue(),
                                        payment.getOrderInfo(), ipAddress);
                        case MOMO -> {
                                // MoMo rejects duplicate orderId — use cached payUrl if available
                                if (payment.getGatewayResponseData() != null
                                                && payment.getGatewayResponseData().containsKey("cachedPayUrl")) {
                                        paymentUrl = (String) payment.getGatewayResponseData().get("cachedPayUrl");
                                } else {
                                        paymentUrl = momoService.createPaymentUrl(payment.getOrderCode(),
                                                        plan.getPrice().longValue(),
                                                        payment.getOrderInfo());
                                }
                        }
                        default -> throw new BusinessException("Cổng thanh toán không được hỗ trợ", "PAYMENT",
                                        ErrorConstants.PAYMENT_GATEWAY_UNSUPPORTED.getCode());
                }

                long expiresIn = payment.getExpiredAt() != null ? Math.max(0,
                                Duration.between(ZonedDateTime.now(), payment.getExpiredAt()).getSeconds()) : 900;

                return InitiatePaymentResponse.builder()
                                .paymentUrl(paymentUrl)
                                .orderId(payment.getOrderCode())
                                .expiresIn((int) expiresIn)
                                .build();
        }
}
