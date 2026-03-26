package com.hhkungfu.backend.infrastructure.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "r2")
public class R2StorageService implements StorageService {

    @Value("${storage.r2.endpoint}")
    private String endpoint;

    @Value("${storage.r2.access-key}")
    private String accessKey;

    @Value("${storage.r2.secret-key}")
    private String secretKey;

    @Value("${storage.r2.bucket}")
    private String bucket;

    @Value("${storage.r2.base-url}")
    private String baseUrl;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .region(Region.of("auto"))
                .build();
    }

    @Override
    public void uploadDirectory(String sourceDir, String destinationKey) throws IOException {
        Path source = Path.of(sourceDir);

        try (java.util.stream.Stream<Path> stream = Files.walk(source)) {
            stream.filter(Files::isRegularFile)
                  .forEach(file -> {
                      String key = destinationKey + "/"
                              + source.relativize(file).toString().replace("\\", "/");
                      s3Client.putObject(
                              PutObjectRequest.builder()
                                      .bucket(bucket)
                                      .key(key)
                                      .contentType(detectContentType(file.getFileName().toString()))
                                      .build(),
                              file
                      );
                  });
        }
    }

    @Override
    public void deleteDirectory(String destinationKey) {
        ListObjectsV2Response list = s3Client.listObjectsV2(
                ListObjectsV2Request.builder().bucket(bucket).prefix(destinationKey + "/").build()
        );

        list.contents().forEach(obj ->
                s3Client.deleteObject(
                        DeleteObjectRequest.builder().bucket(bucket).key(obj.key()).build()
                )
        );
    }

    @Override
    public String getBaseUrl() {
        return baseUrl;
    }

    @Override
    public Resource load(String path) {
        try {
            ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(
                    GetObjectRequest.builder()
                            .bucket(bucket)
                            .key(path)
                            .build()
            );
            return new InputStreamResource(s3Object);
        } catch (NoSuchKeyException e) {
            throw new RuntimeException("File not found in R2: " + path, e);
        } catch (Exception e) {
            throw new RuntimeException("Could not read file from R2: " + path, e);
        }
    }

    private String detectContentType(String fileName) {
        if (fileName.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
        if (fileName.endsWith(".ts")) return "video/mp2t";
        return "application/octet-stream";
    }
}
