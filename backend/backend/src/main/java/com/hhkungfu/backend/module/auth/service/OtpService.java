package com.hhkungfu.backend.module.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.BadRequestAlertException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.module.auth.entity.UserOtp;
import com.hhkungfu.backend.module.auth.enums.OtpType;
import com.hhkungfu.backend.module.auth.repository.UserOtpRepository;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.common.constant.RedisKeys;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final UserOtpRepository userOtpRepository;
    private final MailService mailService;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public void generateAndSendOtp(User user, OtpType otpType) {
        String rateLimitKey = RedisKeys.rateLimitOtp(user.getEmail());
        if (Boolean.TRUE.equals(redisTemplate.hasKey(rateLimitKey))) {
            throw new BadRequestAlertException("Thao tác quá nhanh, vui lòng thử lại sau.", HttpStatus.TOO_MANY_REQUESTS,
                    ErrorConstants.OTP_RATE_LIMIT.getCode());
        }

        // Mark old ones as used
        List<UserOtp> oldOtps = userOtpRepository.findByUserIdAndOtpTypeAndIsUsedFalse(user.getId(), otpType);
        for (UserOtp old : oldOtps) {
            old.setUsed(true);
        }
        userOtpRepository.saveAll(oldOtps);

        // Generate 6 digit OTP
        String otpCode = String.format("%06d", new SecureRandom().nextInt(999999));

        UserOtp otp = UserOtp.builder()
                .user(user)
                .otpCode(otpCode)
                .otpType(otpType)
                .expiresAt(ZonedDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();

        userOtpRepository.save(otp);
        redisTemplate.opsForValue().set(rateLimitKey, "1", Duration.ofSeconds(60));

        String title = otpType == OtpType.VERIFY_EMAIL ? "Mã xác thực tài khoản HHKungfu"
                : otpType == OtpType.CHANGE_PASSWORD ? "Mã xác nhận đổi mật khẩu HHKungfu"
                        : "Mã khôi phục mật khẩu HHKungfu";
        mailService.sendOtpEmail(user, otpCode, title);
    }

    @Transactional
    public boolean verifyOtp(User user, OtpType otpType, String otpCode) {
        String attemptKey = RedisKeys.otpAttempt(user.getId().toString(), otpType.name());
        Long attempts = redisTemplate.opsForValue().increment(attemptKey);
        redisTemplate.expire(attemptKey, Duration.ofMinutes(10));

        if (attempts != null && attempts > 5) {
            throw new BadRequestAlertException("Bạn đã nhập sai OTP quá nhiều lần.", HttpStatus.TOO_MANY_REQUESTS,
                    ErrorConstants.OTP_RATE_LIMIT.getCode());
        }

        return userOtpRepository
                .findByUserIdAndOtpTypeAndIsUsedFalseAndExpiresAtAfter(user.getId(), otpType, ZonedDateTime.now())
                .filter(otp -> otp.getOtpCode().equals(otpCode))
                .map(otp -> {
                    otp.setUsed(true);
                    userOtpRepository.save(otp);
                    redisTemplate.delete(attemptKey);
                    return true;
                }).orElse(false);
    }
}
