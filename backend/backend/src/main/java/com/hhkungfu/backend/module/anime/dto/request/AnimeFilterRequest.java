package com.hhkungfu.backend.module.anime.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnimeFilterRequest {

    private String key;
    // filter
    private String genre;     // slug hoặc name đều được (khuyên dùng slug)
    private String status;    // ONGOING, COMPLETED...
    private Integer year;
    private String type;      // MOVIE, TV...

    // sort
    private String sortBy;    // POPULAR, SCORE, NEWEST, YEAR
    private String order;     // ASC, DESC

    @Min(1)
    @Builder.Default
    private int page = 1;  // 1-based từ client

    @Min(1) @Max(100)
    @Builder.Default
    private int limit = 12;
}