package com.hhkungfu.backend.module.anime.mapper;

import com.hhkungfu.backend.module.anime.dto.GenreDto;
import com.hhkungfu.backend.module.anime.dto.request.CreateGenreRequest;
import com.hhkungfu.backend.module.anime.entity.Genre;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface GenreMapper {
    GenreDto toDto(Genre genre);

    @Mapping(target = "id", ignore = true)
    Genre toEntity(CreateGenreRequest request);

    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(CreateGenreRequest request, @MappingTarget Genre genre);
}
