package com.hhkungfu.backend.module.user.dto;

import lombok.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private UUID id;
    private String username;
    private String avatarUrl;
    private String bio;
    private ZonedDateTime createdAt;
    private UserStatsDto stats;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserStatsDto {
        private long totalWatched;
        private long totalBookmarks;
    }
}
