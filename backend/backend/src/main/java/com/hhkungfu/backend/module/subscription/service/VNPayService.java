package com.hhkungfu.backend.module.subscription.service;

import com.hhkungfu.backend.common.util.HmacUtils;
import com.hhkungfu.backend.config.PaymentProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VNPayService {

    private final PaymentProperties paymentProperties;

    public String createPaymentUrl(String orderCode, long amount, String orderInfo, String ipAddress) {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_OrderType = "other";

        // Ensure orderCode is [a-zA-Z0-9] as per requirement
        String cleanOrderCode = orderCode.replaceAll("[^a-zA-Z0-9]", "");

        Map<String, String> vnp_Params = new TreeMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", paymentProperties.getVnpay().getTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", cleanOrderCode);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", vnp_OrderType);
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", paymentProperties.getVnpay().getReturnUrl());
        vnp_Params.put("vnp_IpAddr", ipAddress);

        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", now.format(formatter));
        vnp_Params.put("vnp_ExpireDate", now.plusMinutes(15).format(formatter));

        String hashData = vnp_Params.entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "="
                        + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        String vnp_SecureHash = HmacUtils.hmacSHA512(paymentProperties.getVnpay().getHashSecret(), hashData);

        return paymentProperties.getVnpay().getPaymentUrl() + "?" + hashData + "&vnp_SecureHash=" + vnp_SecureHash;
    }

    public boolean verifySignature(Map<String, String> params) {
        String vnp_SecureHash = params.get("vnp_SecureHash");
        if (vnp_SecureHash == null)
            return false;

        Map<String, String> signParams = new TreeMap<>(params);
        signParams.remove("vnp_SecureHash");
        signParams.remove("vnp_SecureHashType");

        String hashData = signParams.entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "="
                        + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));

        String expectedHash = HmacUtils.hmacSHA512(paymentProperties.getVnpay().getHashSecret(), hashData);
        return expectedHash.equalsIgnoreCase(vnp_SecureHash);
    }
}
