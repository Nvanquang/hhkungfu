package com.hhkungfu.backend.module.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.auth.entity.UserOtp;
import com.hhkungfu.backend.module.auth.enums.OtpType;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOtpRepository extends JpaRepository<UserOtp, UUID> {
    Optional<UserOtp> findByUserIdAndOtpTypeAndIsUsedFalseAndExpiresAtAfter(UUID userId, OtpType otpType,
            ZonedDateTime now);

    List<UserOtp> findByUserIdAndOtpTypeAndIsUsedFalse(UUID userId, OtpType otpType);
}
