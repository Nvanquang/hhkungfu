package com.hhkungfu.backend.module.anime.service;

import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.module.anime.dto.StudioDto;
import com.hhkungfu.backend.module.anime.entity.Studio;
import com.hhkungfu.backend.module.anime.mapper.StudioMapper;
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

    @Transactional(readOnly = true)
    public List<StudioDto> getAllStudios() {
        return studioRepository.findAll().stream()
                .map(studioMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudioDto getStudioById(Long id) {
        Studio studio = studioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Studio not found with id: " + id, "STUDIO",
                        ErrorConstants.STUDIO_NOT_FOUND.getCode()));
        return studioMapper.toDto(studio);
    }
}
