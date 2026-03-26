package com.hhkungfu.backend.common.util;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

import org.springframework.web.multipart.MultipartFile;

public class VideoUtils {
    public static Double getVideoDuration(MultipartFile multipartFile) {
        File tempFile = null;
        try {
            tempFile = File.createTempFile("upload-", ".mp4");
            multipartFile.transferTo(tempFile);

            ProcessBuilder pb = new ProcessBuilder(
                    "ffprobe",
                    "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    tempFile.getAbsolutePath());

            Process process = pb.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()));

            String duration = reader.readLine();

            process.waitFor();

            return Double.parseDouble(duration);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Process interrupted", e);
        } catch (IOException e) {
            throw new RuntimeException("Error reading video duration", e);
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete(); // 🔥 cực kỳ quan trọng
            }
        }
    }
}
