package com.hhkungfu.backend.module.anime.scheduler;

import com.hhkungfu.backend.module.anime.repository.AnimeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnimeScheduler {

    private final AnimeRepository animeRepository;

    /**
     * Tự động cập nhật viewCount của Anime bằng tổng viewCount của các tập phim.
     * Chạy vào lúc 3:00 AM mỗi ngày.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void updateAnimeViewCounts() {
        log.info("Bắt đầu cập nhật tự động viewCount cho tất cả Anime...");
        try {
            animeRepository.updateAllViewCounts();
            log.info("Cập nhật viewCount hoàn tất thành công.");
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật viewCount tự động: ", e);
        }
    }
}
