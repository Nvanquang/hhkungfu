package com.hhkungfu.backend.module.anime.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GenreDto {
    private Long id;
    private String name;
    private String nameVi;
    private String slug;
}
