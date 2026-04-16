package com.hhkungfu.backend.infrastructure.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local")
public class LocalStorageService implements StorageService {

    @Value("${storage.local.base-path:E:/data/hls}")
    private String basePath;

    @Value("${storage.local.base-url:http://localhost:8080/api/v1/files/hls}")
    private String baseUrl;

    @Override
    public void uploadDirectory(String sourceDir, String destinationKey) throws IOException {
        Path source = Path.of(sourceDir);
        Path destination = Path.of(basePath, destinationKey);
        Files.createDirectories(destination);

        try (java.util.stream.Stream<Path> stream = Files.walk(source)) {
            stream.forEach(src -> {
                try {
                    Path dest = destination.resolve(source.relativize(src));
                    if (Files.isDirectory(src)) {
                        Files.createDirectories(dest);
                    } else {
                        Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Failed to copy file from " + src + " to " + destination, e);
                }
            });
        }
    }

    @Override
    public void deleteDirectory(String destinationKey) throws IOException {
        Path target = Path.of(basePath, destinationKey);
        if (Files.exists(target)) {
            try (java.util.stream.Stream<Path> stream = Files.walk(target)) {
                stream.sorted(Comparator.reverseOrder())
                        .forEach(p -> {
                            try {
                                Files.delete(p);
                            } catch (IOException e) {
                                throw new RuntimeException("Failed to delete " + p, e);
                            }
                        });
            }
        }
    }

    @Override
    public String getBaseUrl() {
        return baseUrl;
    }

    @Override
    public Resource load(String relativePath) {
        try {
            Path base = Path.of(basePath).toRealPath();
            // Security: Normalize path, kiểm tra không thoát ra ngoài basePath
            Path resolved = base.resolve(relativePath).normalize();

            if (!resolved.startsWith(base)) {
                // Path traversal attack detected
                throw new RuntimeException("Access denied: path traversal detected for: " + relativePath);
            }

            Resource resource = new UrlResource(resolved.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + relativePath);
            }
        } catch (java.io.IOException e) {
            throw new RuntimeException("Could not read file: " + relativePath, e);
        }
    }
}
