package com.hhkungfu.backend.module.subscription.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyPaymentResult(String orderCode, String status, String planName) {
        log.info("Pushing WebSocket payment result for order: {}, status: {}", orderCode, status);
        
        Map<String, Object> payload = Map.of(
                "orderId", orderCode,
                "status", status,
                "planName", planName != null ? planName : "Khác"
        );

        // FE will subscribe to topic: /topic/payment/{orderCode}
        messagingTemplate.convertAndSend("/topic/payment/" + orderCode, payload);
    }
}
