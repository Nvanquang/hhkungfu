package com.hhkungfu.backend.module.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.auth.dto.UserDto;
import com.hhkungfu.backend.module.user.dto.ChangePasswordRequest;
import com.hhkungfu.backend.module.user.dto.UpdateProfileRequest;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.repository.UserRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserDto getUserProfile(String userIdStr) {
        User user = userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("User not found", "USER",
                        ErrorConstants.USER_NOT_FOUND.getCode()));
        return mapToDto(user);
    }

    @Transactional
    public UserDto updateProfile(String userIdStr, UpdateProfileRequest request) {
        User user = userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("User not found", "USER",
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new BusinessException("Username đã được sử dụng", "USER",
                        ErrorConstants.USERNAME_ALREADY_EXISTS.getCode());
            }
            user.setUsername(request.username());
        }

        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        if (request.bio() != null) {
            user.setBio(request.bio());
        }

        userRepository.save(user);
        return mapToDto(user);
    }

    @Transactional
    public void changePassword(String userIdStr, ChangePasswordRequest request) {
        User user = userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new ResourceNotFoundException("User not found", "USER",
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

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .provider(user.getProvider())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
