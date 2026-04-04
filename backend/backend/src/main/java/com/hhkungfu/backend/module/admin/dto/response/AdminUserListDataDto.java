package com.hhkungfu.backend.module.admin.dto.response;

import com.hhkungfu.backend.common.response.PageResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AdminUserListDataDto {
    private final List<AdminUserDto> items;
    private final PageResponse.PaginationMeta pagination;
}
