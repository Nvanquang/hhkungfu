package com.hhkungfu.backend.module.auth.service;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hhkungfu.backend.common.exception.AuthException;
import com.hhkungfu.backend.common.exception.BadRequestAlertException;
import com.hhkungfu.backend.common.exception.ConflictException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.common.constant.RedisKeys;
import com.hhkungfu.backend.module.auth.dto.AuthResponse;
import com.hhkungfu.backend.module.auth.dto.ForgotPasswordRequest;
import com.hhkungfu.backend.module.auth.dto.LoginRequest;
import com.hhkungfu.backend.module.auth.dto.RegisterRequest;
import com.hhkungfu.backend.module.auth.dto.ResetPasswordRequest;
import com.hhkungfu.backend.module.auth.dto.UserDto;
import com.hhkungfu.backend.module.auth.dto.VerifyOtpRequest;
import com.hhkungfu.backend.module.auth.enums.OtpType;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.enums.RoleType;
import com.hhkungfu.backend.module.user.repository.UserRepository;
import com.hhkungfu.backend.module.subscription.service.SubscriptionService;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final SecurityUtil securityUtil;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SubscriptionService subscriptionService;

    @Value("${security.authentication.jwt.access-token-validity-in-seconds}")
    private long accessTokenExpiration;

    @Value("${security.authentication.jwt.refresh-token-validity-in-seconds}")
    private long refreshTokenExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email đã được dùng", ErrorConstants.EMAIL_ALREADY_EXISTS.getCode());
        }

        User user = User.builder()
                .email(req.email())
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .provider(ProviderType.LOCAL) // Mặc định provider là LOCAL
                .role(RoleType.USER) // Mặc định role là USER
                .emailVerified(false)
                .isActive(true)
                .build();

        userRepository.save(user);

        otpService.generateAndSendOtp(user, OtpType.VERIFY_EMAIL);

        return buildAuthTokens(user, "Vui lòng kiểm tra email để xác thực tài khoản");
    }

    @Transactional
    public void verifyEmail(VerifyOtpRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(
                        () -> new AuthException("Tài khoản không tồn tại", HttpStatus.NOT_FOUND,
                                ErrorConstants.USER_NOT_FOUND.getCode()));

        if (user.isEmailVerified()) {
            throw new ConflictException("Email đã được xác thực", ErrorConstants.EMAIL_ALREADY_VERIFIED.getCode());
        }

        boolean isValid = otpService.verifyOtp(user, OtpType.VERIFY_EMAIL, req.otpCode());
        if (!isValid) {
            throw new BadRequestAlertException("OTP sai hoặc đã hết hạn", HttpStatus.BAD_REQUEST,
                    ErrorConstants.OTP_INVALID.getCode());
        }

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new AuthException("Tài khoản không tồn tại", HttpStatus.NOT_FOUND,
                                ErrorConstants.USER_NOT_FOUND.getCode()));

        if (user.isEmailVerified()) {
            throw new AuthException("Email đã được xác thực", HttpStatus.CONFLICT,
                    ErrorConstants.EMAIL_ALREADY_VERIFIED.getCode());
        }

        otpService.generateAndSendOtp(user, OtpType.VERIFY_EMAIL);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new AuthException("Sai email hoặc password", HttpStatus.UNAUTHORIZED,
                        ErrorConstants.INVALID_CREDENTIALS.getCode()));

        if (ProviderType.GOOGLE.equals(user.getProvider())) {
            throw new BadRequestAlertException("Tài khoản này đăng ký qua Google, không có password", HttpStatus.BAD_REQUEST,
                    ErrorConstants.OAUTH_ACCOUNT.getCode());
        }

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new AuthException("Sai email hoặc password", HttpStatus.UNAUTHORIZED,
                    ErrorConstants.INVALID_CREDENTIALS.getCode());
        }

        if (!user.isActive()) {
            throw new AuthException("Tài khoản bị khóa bởi admin", HttpStatus.FORBIDDEN,
                    ErrorConstants.ACCOUNT_DISABLED.getCode());
        }

        if (!user.isEmailVerified()) {
            throw new AuthException("Email chưa được xác thực", HttpStatus.FORBIDDEN,
                    ErrorConstants.EMAIL_NOT_VERIFIED.getCode());
        }

        // xác thực người dùng => cần viết hàm loadUserByUsername
        Authentication authentication = this.authenticateUser(req);

        // Sau khi xác thực thành công, lưu thông tin authentication vào SecurityContext
        SecurityContextHolder.getContext().setAuthentication(authentication);

        return buildAuthTokens(user, "Đăng nhập thành công");
    }

    private Authentication authenticateUser(LoginRequest loginDTO) {
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(loginDTO.email(),
                loginDTO.password());
        return authenticationManagerBuilder.getObject().authenticate(authToken);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        Jwt decodedToken = securityUtil.checkValidRefreshToken(refreshToken);
        String userIdStr = decodedToken.getSubject();

        String redisHash = redisTemplate.opsForValue().get(RedisKeys.refresh(userIdStr));
        if (redisHash == null || !redisHash.equals(refreshToken)) {
            throw new BadRequestAlertException("Refresh token không hợp lệ hoặc đã bị revoke", HttpStatus.UNAUTHORIZED,
                    ErrorConstants.REFRESH_TOKEN_INVALID.getCode());
        }

        User user = userRepository.findById(UUID.fromString(userIdStr))
                .orElseThrow(() -> new AuthException("User không tồn tại", HttpStatus.UNAUTHORIZED,
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        if (!user.isActive()) {
            throw new AuthException("Tài khoản bị khóa", HttpStatus.FORBIDDEN,
                    ErrorConstants.ACCOUNT_DISABLED.getCode());
        }

        String newAccessToken = securityUtil.createAccessToken(user);
        String newRefreshToken = securityUtil.createRefreshToken(user);

        // update refresh token in redis
        redisTemplate.opsForValue().set(
                RedisKeys.refresh(userIdStr),
                newRefreshToken,
                refreshTokenExpiration,
                TimeUnit.SECONDS);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(accessTokenExpiration)
                .build();
    }

    public void logout(String userId) {
        redisTemplate.delete(RedisKeys.refresh(userId));
        redisTemplate.opsForValue().set(
                RedisKeys.userLogout(userId),
                String.valueOf(java.time.Instant.now().toEpochMilli()),
                Duration.ofDays(1));
    }

    @Transactional(readOnly = true)
    public UserDto getMe(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AuthException("User not found", HttpStatus.NOT_FOUND,
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        return mapToDto(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.email()).ifPresent(user -> {
            if (ProviderType.GOOGLE.equals(user.getProvider()))
                return;
            otpService.generateAndSendOtp(user, OtpType.FORGOT_PASSWORD);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new AuthException("User không tồn tại", HttpStatus.NOT_FOUND,
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        boolean isValid = otpService.verifyOtp(user, OtpType.FORGOT_PASSWORD, req.otpCode());
        if (!isValid) {
            throw new BadRequestAlertException("OTP sai hoặc đã hết hạn", HttpStatus.BAD_REQUEST,
                    ErrorConstants.OTP_INVALID.getCode());
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        // Force logout all devices
        logout(user.getId().toString());
    }

    private AuthResponse buildAuthTokens(User user, String message) {
        String accessToken = securityUtil.createAccessToken(user);
        String refreshToken = securityUtil.createRefreshToken(user);

        // Store refresh token in redis for 7 days
        redisTemplate.opsForValue().set(RedisKeys.refresh(user.getId().toString()), refreshToken, Duration.ofDays(7));

        return AuthResponse.builder()
                .user(mapToDto(user))
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(accessTokenExpiration)
                .message(message)
                .build();
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
                .isVip(subscriptionService.isVipActive(user.getId()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
