package com.hhkungfu.backend.module.anime.service;

import com.hhkungfu.backend.common.exception.ConflictException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.anime.dto.GenreDto;
import com.hhkungfu.backend.module.anime.dto.request.CreateGenreRequest;
import com.hhkungfu.backend.module.anime.entity.Genre;
import com.hhkungfu.backend.module.anime.mapper.GenreMapper;
import com.hhkungfu.backend.module.anime.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;
    private final GenreMapper genreMapper;

    @Transactional(readOnly = true)
    public List<GenreDto> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(genreMapper::toDto)
                .toList();
    }

    @Transactional
    public GenreDto createGenre(CreateGenreRequest request) {
        if (genreRepository.existsBySlug(request.slug())) {
            throw new ConflictException("Genre slug already exists", ErrorConstants.GENRE_ALREADY_EXISTS.getCode());
        }
        if (genreRepository.existsByName(request.name())) {
            throw new ConflictException("Genre name already exists", ErrorConstants.GENRE_ALREADY_EXISTS.getCode());
        }

        Genre genre = genreMapper.toEntity(request);
        return genreMapper.toDto(genreRepository.save(genre));
    }

    @Transactional(readOnly = true)
    public GenreDto getGenreBySlug(String slug) {
        Genre genre = genreRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Genre not found by slug: " + slug, "GENRE", ErrorConstants.GENRE_NOT_FOUND.getCode()));
        return genreMapper.toDto(genre);
    }
}
