package com.hhkungfu.backend.module.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.enums.RoleType;

@Data
@Builder
public class UserDto {
    private UUID id;
    private String email;
    private String username;
    private RoleType role;
    private boolean emailVerified;
    private ProviderType provider;
    private String avatarUrl;
    private String bio;
    @JsonProperty("isVip")
    private boolean isVip;
    private ZonedDateTime createdAt;
}
