package com.hhkungfu.backend.module.anime.service;

import com.hhkungfu.backend.common.exception.BusinessException;
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
            throw new BusinessException("Genre slug already exists", "GENRE", "GENRE_ALREADY_EXISTS");
        }
        if (genreRepository.existsByName(request.name())) {
            throw new BusinessException("Genre name already exists", "GENRE", "GENRE_ALREADY_EXISTS");
        }

        Genre genre = genreMapper.toEntity(request);
        return genreMapper.toDto(genreRepository.save(genre));
    }

    @Transactional(readOnly = true)
    public GenreDto getGenreBySlug(String slug) {
        Genre genre = genreRepository.findBySlug(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Genre not found by slug: " + slug, "GENRE", "GENRE_NOT_FOUND"));
        return genreMapper.toDto(genre);
    }
}
