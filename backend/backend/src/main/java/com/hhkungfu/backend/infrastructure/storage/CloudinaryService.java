package com.hhkungfu.backend.infrastructure.storage;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hhkungfu.backend.common.exception.BadRequestAlertException;
import com.hhkungfu.backend.common.exception.ErrorConstants;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    // Whitelist MIME type thực sự (không tin Content-Type từ client)
    private static final Map<String, byte[]> ALLOWED_MAGIC_BYTES = Map.of(
            "image/jpeg", new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF },
            "image/png", new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47 },
            "image/webp", new byte[] { 0x52, 0x49, 0x46, 0x46 } // "RIFF"
    );

    private static final long MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
    private static final int MAX_DIMENSION = 5000; // px

    public Map<String, String> upload(MultipartFile file, String folder) throws IOException {
        validate(file);

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "image",
                        // Cloudinary tự sanitize metadata — vẫn nên bật
                        "invalidate", true));

        return Map.of(
                "url", (String) result.get("secure_url"),
                "public_id", (String) result.get("public_id"));
    }

    public void delete(String publicId) throws IOException {
        if (publicId != null && !publicId.isBlank()) {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        }
    }

    // ───────────────────────────────────────────
    // VALIDATE
    // ───────────────────────────────────────────
    private void validate(MultipartFile file) throws IOException {
        checkNotEmpty(file);
        checkFileSize(file);
        checkExtension(file);
        checkMagicBytes(file); // chống giả extension
        checkImageReadable(file); // chống Pixel Flood / DoS
        checkNoSvg(file); // chặn SVG (XSS/XXE/SSRF)
    }

    /** 1. File không được rỗng */
    private void checkNotEmpty(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new BadRequestAlertException("File không được để trống", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_EMPTY.getCode());
    }

    /** 2. Giới hạn kích thước — chống DoS */
    private void checkFileSize(MultipartFile file) {
        if (file.getSize() > MAX_SIZE_BYTES)
            throw new BadRequestAlertException("Ảnh không được vượt quá 2MB", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_SIZE_EXCEEDED.getCode());
    }

    /** 3. Whitelist extension — không dùng blacklist */
    private void checkExtension(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank())
            throw new BadRequestAlertException("Tên file không hợp lệ", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_INVALID_NAME.getCode());

        // Chặn tên file chứa ký tự nguy hiểm
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\"))
            throw new BadRequestAlertException("Tên file chứa ký tự không hợp lệ", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_INVALID_NAME.getCode());

        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        if (!Set.of("jpg", "jpeg", "png", "webp").contains(ext))
            throw new BadRequestAlertException("Chỉ chấp nhận JPG, PNG, WEBP", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_TYPE_NOT_SUPPORTED.getCode());
    }

    /**
     * 4. Kiểm tra Magic Bytes (file signature)
     * — chống giả extension: đổi tên shell.php → shell.jpg
     * — Content-Type từ client KHÔNG đáng tin
     */
    private void checkMagicBytes(MultipartFile file) throws IOException {
        byte[] bytes = file.getBytes();
        if (bytes.length < 4)
            throw new BadRequestAlertException("File quá nhỏ, không hợp lệ", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_MALFORMED.getCode());

        boolean matched = ALLOWED_MAGIC_BYTES.values().stream().anyMatch(magic -> {
            for (int i = 0; i < magic.length; i++) {
                if (bytes[i] != magic[i])
                    return false;
            }
            return true;
        });

        if (!matched)
            throw new BadRequestAlertException("Nội dung file không khớp định dạng ảnh hợp lệ", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_TYPE_NOT_SUPPORTED.getCode());
    }

    /**
     * 5. Đọc thực sự bằng ImageIO
     * — chống Pixel Flood (ảnh nhỏ nhưng giải nén ra cực lớn gây DoS/OOM)
     * — chống file giả mạo qua được magic bytes check
     */
    private void checkImageReadable(MultipartFile file) throws IOException {
        try (var input = ImageIO.createImageInputStream(file.getInputStream())) {
            if (input == null)
                throw new BadRequestAlertException("Không thể đọc file ảnh", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_MALFORMED.getCode());

            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext())
                throw new BadRequestAlertException("Định dạng ảnh không được hỗ trợ", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_TYPE_NOT_SUPPORTED.getCode());

            ImageReader reader = readers.next();
            try {
                reader.setInput(input);

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                // Chống Pixel Flood: ảnh quá lớn sau khi giải nén
                if (width > MAX_DIMENSION || height > MAX_DIMENSION)
                    throw new BadRequestAlertException(
                            "Kích thước ảnh không được vượt quá " + MAX_DIMENSION + "px", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_DIMENSIONS_EXCEEDED.getCode());

                // Chống decompression bomb: tích width*height quá lớn
                if ((long) width * height > (long) MAX_DIMENSION * MAX_DIMENSION)
                    throw new BadRequestAlertException("Ảnh quá lớn sau khi giải nén", HttpStatus.BAD_REQUEST, ErrorConstants.IMAGE_SIZE_EXCEEDED.getCode());

            } finally {
                reader.dispose();
            }
        }
    }

    /**
     * 6. Chặn SVG hoàn toàn
     * — SVG có thể chứa XSS, XXE, SSRF payloads
     * — Dù extension không phải .svg, vẫn check content
     */
    private void checkNoSvg(MultipartFile file) throws IOException {
        String contentStart = new String(file.getBytes(), 0,
                Math.min(512, (int) file.getSize()));

        if (contentStart.toLowerCase().contains("<svg") ||
                contentStart.toLowerCase().contains("<!entity") ||
                contentStart.toLowerCase().contains("<?xml")) {
            throw new BadRequestAlertException("Định dạng SVG/XML không được chấp nhận", HttpStatus.BAD_REQUEST, ErrorConstants.SVG_NOT_ALLOWED.getCode());
        }
    }
}