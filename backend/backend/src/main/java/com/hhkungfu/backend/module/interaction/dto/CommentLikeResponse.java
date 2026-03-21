package com.hhkungfu.backend.module.interaction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentLikeResponse {
    private boolean liked;
    private int likeCount;
}
