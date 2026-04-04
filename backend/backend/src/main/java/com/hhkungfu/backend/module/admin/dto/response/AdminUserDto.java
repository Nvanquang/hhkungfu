package com.hhkungfu.backend.module.admin.dto.response;

import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.enums.RoleType;
import lombok.Builder;
import lombok.Getter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Builder
public class AdminUserDto {
    private final UUID id;
    private final String email;
    private final String username;
    private final String avatarUrl;
    private final RoleType role;
    private final boolean isActive;
    private final boolean emailVerified;
    private final ProviderType provider;
    private final boolean isVip;
    private final ZonedDateTime vipExpiresAt;
    private final long totalWatched;
    private final ZonedDateTime createdAt;
}
