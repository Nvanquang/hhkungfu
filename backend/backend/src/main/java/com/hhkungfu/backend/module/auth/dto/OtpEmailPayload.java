package com.hhkungfu.backend.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OtpEmailPayload {

    private String email;

    private String username;

    private String otp;

    private String titleKey;
}
