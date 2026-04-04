package com.hhkungfu.backend.module.admin.dto.request;

import com.hhkungfu.backend.module.user.enums.RoleType;
import jakarta.validation.constraints.NotNull;

public record PatchUserRoleRequest(@NotNull RoleType role) {
}
