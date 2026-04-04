package com.hhkungfu.backend.module.anime.service;

import com.hhkungfu.backend.common.exception.ConflictException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.anime.dto.StudioDto;
import com.hhkungfu.backend.module.anime.dto.request.CreateStudioRequest;
import com.hhkungfu.backend.module.anime.dto.request.UpdateStudioRequest;
import com.hhkungfu.backend.module.anime.entity.Studio;
import com.hhkungfu.backend.module.anime.mapper.StudioMapper;
import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import com.hhkungfu.backend.module.anime.repository.StudioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudioService {
    private final StudioRepository studioRepository;
    private final StudioMapper studioMapper;
    private final AnimeRepository animeRepository;

    @Transactional(readOnly = true)
    public List<StudioDto> getAllStudios() {
        return studioRepository.findAll().stream()
                .map(studioMapper::toDto)
                .toList();
    }

    @Transactional
    public StudioDto createStudio(CreateStudioRequest request) {
        if (studioRepository.existsByName(request.name())) {
            throw new ConflictException("Studio name already exists", ErrorConstants.SLUG_ALREADY_EXISTS.getCode()); // Or create STUDIO_ALREADY_EXISTS
        }
        Studio studio = studioMapper.toEntity(request);
        return studioMapper.toDto(studioRepository.save(studio));
    }

    @Transactional
    public StudioDto updateStudio(Long id, UpdateStudioRequest request) {
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Studio not found", "STUDIO", ErrorConstants.STUDIO_NOT_FOUND.getCode()));

        if (!studio.getName().equals(request.name()) && studioRepository.existsByName(request.name())) {
            throw new ConflictException("Studio name already exists", ErrorConstants.SLUG_ALREADY_EXISTS.getCode());
        }

        studio.setName(request.name());
        studio.setLogoUrl(request.logoUrl());

        return studioMapper.toDto(studioRepository.save(studio));
    }

    @Transactional
    public void deleteStudio(Long id) {
        if (animeRepository.existsByStudiosId(id)) {
            throw new ConflictException("Cannot delete studio because it is used by some animes", ErrorConstants.STUDIO_IN_USE.getCode());
        }
        studioRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public StudioDto getStudioById(Long id) {
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Studio not found with id: " + id, "STUDIO",
                        ErrorConstants.STUDIO_NOT_FOUND.getCode()));
        return studioMapper.toDto(studio);
    }
}
