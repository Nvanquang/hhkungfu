package com.hhkungfu.backend.module.subscription.service;

import com.hhkungfu.backend.module.subscription.repository.PaymentRepository;
import com.hhkungfu.backend.module.subscription.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionJobService {

    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PaymentRepository paymentRepository;

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    @Transactional
    public void expireSubscriptions() {
        log.info("Running job to expire overdue subscriptions...");
        int updated = userSubscriptionRepository.expireOverdueSubscriptions(ZonedDateTime.now());
        log.info("Expired {} subscriptions", updated);
    }

    @Scheduled(fixedRate = 300000) // Every 5 minutes
    @Transactional
    public void expireStalePayments() {
        log.info("Running job to expire stale payments...");
        ZonedDateTime now = ZonedDateTime.now();
        List<Long> expiredSubIds = paymentRepository.findExpiredPendingSubIds(now);
        
        int updatedPayments = paymentRepository.expireStalePayments(now);
        log.info("Expired {} payments", updatedPayments);

        if (!expiredSubIds.isEmpty()) {
            userSubscriptionRepository.bulkCancel(expiredSubIds);
            log.info("Cancelled {} subscriptions due to payment expiration", expiredSubIds.size());
        }
    }
}
