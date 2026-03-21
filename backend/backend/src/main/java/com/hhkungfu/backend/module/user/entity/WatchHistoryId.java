package com.hhkungfu.backend.module.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class WatchHistoryId implements Serializable {
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "episode_id")
    private Long episodeId;
}
