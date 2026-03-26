package com.hhkungfu.backend.module.episode.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateEpisodeRequest {
    private String title;
    private String description;
    private String thumbnailUrl;
    private Boolean isVipOnly = false;
    private Boolean hasVietsub = false;
    private Boolean hasEngsub = false;
    private LocalDate airedDate;
}
