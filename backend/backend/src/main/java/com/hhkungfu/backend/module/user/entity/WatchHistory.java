package com.hhkungfu.backend.module.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.ZonedDateTime;

@Entity
@Table(name = "watch_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchHistory {

    @EmbeddedId
    private WatchHistoryId id;

    @Column(name = "progress_seconds", nullable = false)
    private int progressSeconds;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted;

    @UpdateTimestamp
    @Column(name = "watched_at", nullable = false)
    private ZonedDateTime watchedAt;
}
