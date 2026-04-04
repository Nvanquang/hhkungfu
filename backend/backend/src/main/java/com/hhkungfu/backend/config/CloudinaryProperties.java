package com.hhkungfu.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "cloudinary")
public class CloudinaryProperties {

    /**
     * When true, Cloudinary bean is created (requires cloud-name, api-key,
     * api-secret).
     */
    private boolean enabled = false;

    private String cloudName;
    private String apiKey;
    private String apiSecret;
}
