package com.hhkungfu.backend.module.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.auth.enums.OtpType;
import com.hhkungfu.backend.module.auth.service.OtpService;
import com.hhkungfu.backend.module.interaction.repository.BookmarkRepository;
import com.hhkungfu.backend.module.user.dto.ChangePasswordRequest;
import com.hhkungfu.backend.module.user.dto.ConfirmChangePasswordRequest;
import com.hhkungfu.backend.module.user.dto.UpdateProfileRequest;
import com.hhkungfu.backend.module.user.dto.UserProfileDto;
import com.hhkungfu.backend.module.user.entity.User;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.Duration;
import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.repository.UserRepository;
import com.hhkungfu.backend.module.user.repository.WatchHistoryRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final BookmarkRepository bookmarkRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final StringRedisTemplate redisTemplate;

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(String userIdStr) {
        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại", "USER",
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        return mapToProfileDto(user);
    }

    @Transactional
    public UserProfileDto updateProfile(String userIdStr, UpdateProfileRequest request) {
        User user = userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại", "USER",
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        if (request.username() != null) {
            user.setUsername(request.username());
        }

        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        if (request.bio() != null) {
            user.setBio(request.bio());
        }

        user = userRepository.save(user);
        return mapToProfileDto(user);
    }

    @Transactional
    public void requestChangePassword(String userIdStr, ChangePasswordRequest request) {
        User user = userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại", "USER",
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        if (ProviderType.GOOGLE.equals(user.getProvider())) {
            throw new BusinessException("Tài khoản đăng ký qua Google không thể đổi mật khẩu", "USER",
                    ErrorConstants.OAUTH_ACCOUNT.getCode());
        }

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new BusinessException("Mật khẩu cũ không chính xác", "USER",
                    ErrorConstants.INVALID_PASSWORD.getCode());
        }

        if (request.oldPassword().equals(request.newPassword())) {
            throw new BusinessException("Mật khẩu mới không được trùng mật khẩu cũ", "USER",
                    ErrorConstants.SAME_PASSWORD.getCode());
        }

        // Store pending encrypted password in Redis for 15 minutes
        String pendingKey = "pending_password:" + user.getId();
        String encodedPassword = passwordEncoder.encode(request.newPassword());
        redisTemplate.opsForValue().set(pendingKey, encodedPassword, Duration.ofMinutes(15));

        // Generate and send OTP
        otpService.generateAndSendOtp(user, OtpType.CHANGE_PASSWORD);
    }

    @Transactional
    public void confirmChangePassword(String userIdStr, ConfirmChangePasswordRequest request) {
        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại", "USER",
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        // Verify OTP
        boolean isValid = otpService.verifyOtp(user, OtpType.CHANGE_PASSWORD, request.otpCode());
        if (!isValid) {
            throw new BusinessException("Mã OTP không chính xác hoặc đã hết hạn", "USER",
                    ErrorConstants.OTP_INVALID.getCode());
        }

        // Retrieve pending password from Redis
        String pendingKey = "pending_password:" + user.getId();
        String encodedPassword = redisTemplate.opsForValue().get(pendingKey);

        if (encodedPassword == null) {
            throw new BusinessException("Yêu cầu đã hết hạn, vui lòng thực hiện lại từ đầu", "USER",
                    ErrorConstants.OTP_EXPIRED.getCode());
        }

        // Update password
        user.setPassword(encodedPassword);
        userRepository.save(user);

        // Clean up Redis
        redisTemplate.delete(pendingKey);
    }

    private UserProfileDto mapToProfileDto(User user) {
        long totalWatched = watchHistoryRepository.countByIdUserIdAndIsCompletedTrue(user.getId());
        long totalBookmarks = bookmarkRepository.countByIdUserId(user.getId());

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .stats(UserProfileDto.UserStatsDto.builder()
                        .totalWatched(totalWatched)
                        .totalBookmarks(totalBookmarks)
                        .build())
                .build();
    }
}
