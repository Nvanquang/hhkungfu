package com.hhkungfu.backend.module.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import com.hhkungfu.backend.module.auth.enums.OtpType;
import com.hhkungfu.backend.module.user.entity.User;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "otp_code", nullable = false, length = 10)
    private String otpCode;

    // VERIFY_EMAIL, RESET_PASSWORD, FORGOT_PASSWORD
    @Enumerated(EnumType.STRING)
    @Column(name = "otp_type", nullable = false, length = 20)
    private OtpType otpType;

    @Column(name = "expires_at", nullable = false)
    private ZonedDateTime expiresAt;

    @Column(name = "is_used", nullable = false)
    private boolean isUsed;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
