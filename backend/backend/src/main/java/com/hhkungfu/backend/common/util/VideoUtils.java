package com.hhkungfu.backend.common.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.concurrent.TimeUnit;

import org.springframework.web.multipart.MultipartFile;

public class VideoUtils {

    // 🔐 Security: Timeout 60 giây để lấy duration — tránh bị treo bởi malformed file
    private static final long PROBE_TIMEOUT_SECONDS = 60;

    /**
     * Lấy thời lượng video từ MultipartFile bằng ffprobe.
     * Sử dụng ffprobe từ PATH hệ thống (cần cấu hình trong production).
     * Có timeout để tránh bị block bởi file độc hại.
     */
    public static Double getVideoDuration(MultipartFile multipartFile) {
        File tempFile = null;
        Process process = null;
        try {
            // 🔐 Security: UUID random temp filename
            tempFile = File.createTempFile("probe-" + java.util.UUID.randomUUID(), ".mp4");
            multipartFile.transferTo(tempFile);

            // 🔐 Security: Dùng args array (không concat string) — tránh command injection
            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    tempFile.getAbsolutePath()
            );
            // Không inherit environment — tránh env injection
            pb.redirectErrorStream(false);

            process = pb.start();

            // 🔐 Security: Timeout để tránh bị treo vô hạn bởi malformed/bomb file
            boolean finished = process.waitFor(PROBE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("ffprobe timeout sau " + PROBE_TIMEOUT_SECONDS + " giây");
            }

            if (process.exitValue() != 0) {
                throw new RuntimeException("ffprobe thất bại với exit code: " + process.exitValue());
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String durationStr = reader.readLine();
                if (durationStr == null || durationStr.isBlank()) {
                    return 0.0;
                }
                return Double.parseDouble(durationStr.trim());
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Process bị gián đoạn", e);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi đọc thời lượng video", e);
        } finally {
            // 🔐 Security: Luôn xóa temp file
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
            // Đảm bảo process được kill
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
        }
    }
}
