package com.hhkungfu.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "payment")
@Getter
@Setter
public class PaymentProperties {

    private VnPay vnpay = new VnPay();
    private MoMo momo = new MoMo();

    @Getter
    @Setter
    public static class VnPay {
        private String tmnCode;
        private String hashSecret;
        private String paymentUrl;
        private String returnUrl;
        private String ipnUrl;
    }

    @Getter
    @Setter
    public static class MoMo {
        private String partnerCode;
        private String accessKey;
        private String secretKey;
        private String apiUrl;
        private String redirectUrl;
        private String ipnUrl;
    }
}
