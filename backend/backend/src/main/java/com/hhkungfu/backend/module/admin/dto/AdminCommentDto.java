package com.hhkungfu.backend.module.admin.dto;

import com.hhkungfu.backend.module.interaction.dto.CommentDto;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCommentDto {
    private Long id;
    private String content;
    private Integer likeCount;
    private Boolean isPinned;
    private Long replyCount;
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;
    private CommentDto.UserSummary user;
    
    // Episode/Anime info
    private Long episodeId;
    private Integer episodeNumber;
    private String animeName;
    private Long animeId;
    
    // Parent info for identification
    private Long parentId;
}
