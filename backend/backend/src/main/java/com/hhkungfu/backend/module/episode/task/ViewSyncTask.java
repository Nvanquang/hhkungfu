package com.hhkungfu.backend.module.episode.task;

import com.hhkungfu.backend.module.episode.service.EpisodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ViewSyncTask {

    private final EpisodeService episodeService;

    /**
     * Sync view counts from Redis to DB every 5 minutes.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes in milliseconds
    public void syncViewCounts() {
        log.info("Starting scheduled view count synchronization...");
        try {
            episodeService.syncViewsToDb();
            log.info("View count synchronization completed successfully.");
        } catch (Exception e) {
            log.error("Error occurred during view count synchronization", e);
        }
    }
}
