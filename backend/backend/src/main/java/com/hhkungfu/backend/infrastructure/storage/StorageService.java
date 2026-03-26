package com.hhkungfu.backend.infrastructure.storage;

import org.springframework.core.io.Resource;
import java.io.IOException;

public interface StorageService {
    void uploadDirectory(String sourceDir, String destinationKey) throws IOException;
    void deleteDirectory(String destinationKey) throws IOException;
    String getBaseUrl();
    Resource load(String path);
}
