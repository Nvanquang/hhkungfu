package com.hhkungfu.backend.module.video.service;

import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.regex.Pattern;

/**
 * Security validator for video/audio file uploads.
 * Validates based on magic bytes, file size, and filename safety.
 * Does NOT trust client-provided content-type or filename.
 */
@Slf4j
@Component
public class VideoFileValidator {

    // Max file size: 8 GB
    private static final long MAX_SIZE_BYTES = 8L * 1024 * 1024 * 1024;

    // Reject double-extension patterns: video.mp4.php, file.mp4.exe
    private static final Pattern DOUBLE_EXTENSION_PATTERN = Pattern.compile("(?i)^.*\\.(mp4|mp3)\\.[a-z0-9]{1,10}$");

    // MP4 magic bytes: "ftyp" at offset 4 → bytes 4-7 = 0x66 0x74 0x79 0x70
    private static final byte[] MP4_MAGIC = { 0x66, 0x74, 0x79, 0x70 };

    // MP3 magic bytes (ID3 tag): 0x49 0x44 0x33
    private static final byte[] MP3_ID3_MAGIC = { 0x49, 0x44, 0x33 };

    // MP3 frame sync (no ID3): 0xFF 0xFB or 0xFF 0xFA or 0xFF 0xF3
    private static final byte MP3_FRAME_SYNC_FIRST = (byte) 0xFF;
    private static final byte MP3_FRAME_SYNC_SECOND_1 = (byte) 0xFB;
    private static final byte MP3_FRAME_SYNC_SECOND_2 = (byte) 0xFA;
    private static final byte MP3_FRAME_SYNC_SECOND_3 = (byte) 0xF3;
    private static final byte MP3_FRAME_SYNC_SECOND_4 = (byte) 0xE3;

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File không được trống", "VIDEO", ErrorConstants.UPLOAD_FAILED.getCode());
        }

        validateFileSize(file);
        validateFilename(file);
        validateMagicBytes(file);
    }

    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > MAX_SIZE_BYTES) {
            log.warn("[VideoSecurity] File quá lớn: {} bytes", file.getSize());
            throw new BusinessException(
                    "File quá lớn. Tối đa 8GB",
                    "VIDEO",
                    ErrorConstants.VIDEO_TOO_LARGE.getCode());
        }
    }

    private void validateFilename(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return; // Tên file rỗng vẫn accept — sẽ tự gán UUID ở service
        }

        // Reject double extension
        if (DOUBLE_EXTENSION_PATTERN.matcher(originalName).matches()) {
            log.warn("[VideoSecurity] Double extension bị từ chối: {}", originalName);
            throw new BusinessException(
                    "Tên file không hợp lệ",
                    "VIDEO",
                    ErrorConstants.VIDEO_INVALID_FILENAME.getCode());
        }

        // Reject path traversal trong filename
        if (originalName.contains("..") || originalName.contains("/") || originalName.contains("\\")) {
            log.warn("[VideoSecurity] Path traversal trong filename: {}", originalName);
            throw new BusinessException(
                    "Tên file không hợp lệ",
                    "VIDEO",
                    ErrorConstants.VIDEO_INVALID_FILENAME.getCode());
        }
    }

    private void validateMagicBytes(MultipartFile file) {
        // Đọc đủ bytes để detect cả MP4 (ftyp ở offset 4) và MP3
        byte[] header = new byte[12];
        try (InputStream is = file.getInputStream()) {
            int bytesRead = is.read(header, 0, header.length);
            if (bytesRead < 8) {
                throw new BusinessException("File quá nhỏ hoặc bị hỏng", "VIDEO",
                        ErrorConstants.VIDEO_MALFORMED.getCode());
            }
        } catch (IOException e) {
            throw new BusinessException("Không thể đọc file", "VIDEO", ErrorConstants.UPLOAD_FAILED.getCode());
        }

        if (isMp4(header) || isMp3(header)) {
            return; // Hợp lệ
        }

        log.warn("[VideoSecurity] Magic bytes không hợp lệ. Header: {} {} {} {} {} {} {} {}",
                String.format("0x%02X", header[0]), String.format("0x%02X", header[1]),
                String.format("0x%02X", header[2]), String.format("0x%02X", header[3]),
                String.format("0x%02X", header[4]), String.format("0x%02X", header[5]),
                String.format("0x%02X", header[6]), String.format("0x%02X", header[7]));

        throw new BusinessException(
                "Định dạng file không được hỗ trợ. Chỉ chấp nhận MP4 và MP3",
                "VIDEO",
                ErrorConstants.VIDEO_INVALID_TYPE.getCode());
    }

    /**
     * MP4: bytes[4..7] == "ftyp" (0x66 0x74 0x79 0x70)
     */
    private boolean isMp4(byte[] header) {
        if (header.length < 8)
            return false;
        return header[4] == MP4_MAGIC[0]
                && header[5] == MP4_MAGIC[1]
                && header[6] == MP4_MAGIC[2]
                && header[7] == MP4_MAGIC[3];
    }

    /**
     * MP3: Bắt đầu bằng ID3 tag (0x49 0x44 0x33) hoặc frame sync (0xFF
     * 0xFB/FA/F3/E3)
     */
    private boolean isMp3(byte[] header) {
        if (header.length < 3)
            return false;

        // ID3 tag
        if (header[0] == MP3_ID3_MAGIC[0]
                && header[1] == MP3_ID3_MAGIC[1]
                && header[2] == MP3_ID3_MAGIC[2]) {
            return true;
        }

        // Frame sync (no ID3)
        if (header[0] == MP3_FRAME_SYNC_FIRST) {
            byte second = header[1];
            return second == MP3_FRAME_SYNC_SECOND_1
                    || second == MP3_FRAME_SYNC_SECOND_2
                    || second == MP3_FRAME_SYNC_SECOND_3
                    || second == MP3_FRAME_SYNC_SECOND_4;
        }

        return false;
    }
}
