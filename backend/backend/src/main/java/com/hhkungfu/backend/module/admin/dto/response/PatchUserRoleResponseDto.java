package com.hhkungfu.backend.module.admin.dto.response;

import com.hhkungfu.backend.module.user.enums.RoleType;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class PatchUserRoleResponseDto {
    private final UUID id;
    private final RoleType role;
}
