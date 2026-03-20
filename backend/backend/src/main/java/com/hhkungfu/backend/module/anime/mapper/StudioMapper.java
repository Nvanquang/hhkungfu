package com.hhkungfu.backend.module.anime.mapper;

import com.hhkungfu.backend.module.anime.dto.StudioDto;
import com.hhkungfu.backend.module.anime.entity.Studio;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface StudioMapper {
    StudioDto toDto(Studio studio);
}
