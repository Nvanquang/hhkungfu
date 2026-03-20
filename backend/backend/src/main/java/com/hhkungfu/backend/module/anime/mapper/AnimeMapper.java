package com.hhkungfu.backend.module.anime.mapper;

import com.hhkungfu.backend.module.anime.dto.AnimeDetailDto;
import com.hhkungfu.backend.module.anime.dto.AnimeSummaryDto;
import com.hhkungfu.backend.module.anime.dto.request.CreateAnimeRequest;
import com.hhkungfu.backend.module.anime.dto.request.UpdateAnimeRequest;
import com.hhkungfu.backend.module.anime.entity.Anime;
import org.mapstruct.*;

@Mapper(componentModel = "spring", uses = {GenreMapper.class, StudioMapper.class})
public interface AnimeMapper {

    @Mapping(target = "ageRating", expression = "java(anime.getAgeRating() != null ? anime.getAgeRating().getValue() : null)")
    @Mapping(target = "averageRating", ignore = true) // Not yet implemented, maybe handled by interaction module or aggregation
    @Mapping(target = "totalRatings", ignore = true) // Same here
    AnimeDetailDto toDetailDto(Anime anime);

    AnimeSummaryDto toSummaryDto(Anime anime);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "hasVipContent", ignore = true)
    @Mapping(target = "genres", ignore = true)
    @Mapping(target = "studios", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Anime toEntity(CreateAnimeRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true) // handled manually to avoid conflicts
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "hasVipContent", ignore = true)
    @Mapping(target = "genres", ignore = true)
    @Mapping(target = "studios", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(UpdateAnimeRequest request, @MappingTarget Anime anime);
}
