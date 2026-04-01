package com.hhkungfu.backend.module.subscription.service;

import com.hhkungfu.backend.common.util.HmacUtils;
import com.hhkungfu.backend.config.PaymentProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MoMoService {

    private final PaymentProperties paymentProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    public String createPaymentUrl(String orderCode, long amount, String orderInfo) {
        String requestId = UUID.randomUUID().toString();
        String requestType = "payWithMethod";
        String extraData = "";

        String frontendReturnUrl = paymentProperties.getMomo().getRedirectUrl(); // URL Frontend
        String ipnUrl = paymentProperties.getMomo().getIpnUrl(); // URL Ngrok POST

        // signature =
        // accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
        String rawSignature = String.format(
                "accessKey=%s&amount=%s&extraData=%s&ipnUrl=%s&orderId=%s&orderInfo=%s&partnerCode=%s&redirectUrl=%s&requestId=%s&requestType=%s",
                paymentProperties.getMomo().getAccessKey(),
                amount,
                extraData,
                ipnUrl,
                orderCode,
                orderInfo,
                paymentProperties.getMomo().getPartnerCode(),
                frontendReturnUrl,
                requestId,
                requestType);

        String signature = HmacUtils.hmacSHA256(paymentProperties.getMomo().getSecretKey(), rawSignature);

        Map<String, Object> body = new HashMap<>();
        body.put("partnerCode", paymentProperties.getMomo().getPartnerCode());
        body.put("partnerName", "HHKungfu Streaming");
        body.put("storeId", "HHKungfu");
        body.put("requestId", requestId);
        body.put("amount", amount);
        body.put("orderId", orderCode);
        body.put("orderInfo", orderInfo);
        body.put("redirectUrl", frontendReturnUrl);
        body.put("ipnUrl", ipnUrl);
        body.put("lang", "vi");
        body.put("extraData", extraData);
        body.put("requestType", requestType);
        body.put("signature", signature);

        try {
            ResponseEntity<Map<String, Object>> responseEntity = restTemplate.exchange(
                    paymentProperties.getMomo().getApiUrl(),
                    HttpMethod.POST,
                    new HttpEntity<>(body),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            Map<String, Object> response = responseEntity.getBody();
            if (response != null && response.containsKey("payUrl")) {
                return (String) response.get("payUrl");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error calling MoMo API: " + e.getMessage(), e);
        }
        return null;
    }

    private String decodeUtf8(String val) {
        if (val == null)
            return null;
        try {
            byte[] isoBytes = val.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
            String utf8Str = new String(isoBytes, java.nio.charset.StandardCharsets.UTF_8);
            // Heuristic to detect if it was incorrectly decoded by Tomcat as ISO-8859-1
            if (utf8Str.indexOf('\uFFFD') == -1 && utf8Str.length() < val.length()) {
                return utf8Str;
            }
        } catch (Exception e) {
            // Ignore and fallback
        }
        return val;
    }

    public boolean verifySignature(Map<String, String> params) {
        String signature = params.get("signature");
        if (signature == null)
            return false;

        String amount = params.get("amount");
        String extraData = decodeUtf8(params.get("extraData"));
        String message = decodeUtf8(params.get("message"));
        String orderId = params.get("orderId");
        String orderInfo = decodeUtf8(params.get("orderInfo"));
        String partnerCode = paymentProperties.getMomo().getPartnerCode();
        String requestId = params.get("requestId");
        String responseTime = params.get("responseTime");
        String resultCode = params.get("resultCode");
        String transId = params.get("transId");

        // signature =
        // accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&requestId=$requestId&responseTime=$responseTime&resultCode=$resultCode&transId=$transId
        String rawSignature = String.format(
                "accessKey=%s&amount=%s&extraData=%s&message=%s&orderId=%s&orderInfo=%s&partnerCode=%s&requestId=%s&responseTime=%s&resultCode=%s&transId=%s",
                paymentProperties.getMomo().getAccessKey(),
                amount,
                extraData,
                message,
                orderId,
                orderInfo,
                partnerCode,
                requestId,
                responseTime,
                resultCode,
                transId);

        String expectedSignature = HmacUtils.hmacSHA256(paymentProperties.getMomo().getSecretKey(), rawSignature);

        log.info("=== MoMo Signature Verification ===");
        log.info("Received Params: {}", params);
        log.info("Raw String to Hash: {}", rawSignature);
        log.info("Expected Signature: {}", expectedSignature);
        log.info("Actual Signature: {}", signature);

        return expectedSignature.equalsIgnoreCase(signature);
    }

    public Map<String, Object> checkTransactionStatus(String orderId, String requestId) {
        String queryUrl = paymentProperties.getMomo().getApiUrl().replace("/create", "/query");

        String requestRawData = String.format(
                "accessKey=%s&orderId=%s&partnerCode=%s&requestId=%s",
                paymentProperties.getMomo().getAccessKey(),
                orderId,
                paymentProperties.getMomo().getPartnerCode(),
                requestId);
        String signature = HmacUtils.hmacSHA256(paymentProperties.getMomo().getSecretKey(), requestRawData);

        Map<String, Object> body = new HashMap<>();
        body.put("partnerCode", paymentProperties.getMomo().getPartnerCode());
        body.put("requestId", requestId);
        body.put("orderId", orderId);
        body.put("lang", "vi");
        body.put("signature", signature);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    queryUrl,
                    HttpMethod.POST,
                    new HttpEntity<>(body),
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            Map<String, Object> resBody = response.getBody();
            if (resBody != null && resBody.containsKey("resultCode")) {
                return resBody;
            }
        } catch (Exception e) {
            log.warn("Failed to query MoMo transaction status for order {}: {}", orderId, e.getMessage());
        }
        return null;
    }
}
