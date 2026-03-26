package com.hhkungfu.backend.module.video.service;

import com.hhkungfu.backend.infrastructure.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VideoStreamService {

    private final StorageService storageService;

    /**
     * Load a HLS file from the underlying storage (local or R2).
     * Relative path example: "ep-101/master.m3u8"
     */
    public Resource loadHlsFile(String relativePath) {
        return storageService.load(relativePath);
    }
}
