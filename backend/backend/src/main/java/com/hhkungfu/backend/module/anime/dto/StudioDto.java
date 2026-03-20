package com.hhkungfu.backend.module.anime.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudioDto {
    private Long id;
    private String name;
    private String logoUrl;
}
