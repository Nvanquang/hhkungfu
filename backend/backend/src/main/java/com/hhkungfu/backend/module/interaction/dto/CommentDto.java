package com.hhkungfu.backend.module.interaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {

    private Long id;
    private String content;
    private Integer likeCount;
    private Boolean isPinned;
    private Long replyCount;
    private Boolean isLikedByMe;
    private LocalDateTime createdAt;
    private UserSummary user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private UUID id;
        private String username;
        private String avatarUrl;
    }
}
