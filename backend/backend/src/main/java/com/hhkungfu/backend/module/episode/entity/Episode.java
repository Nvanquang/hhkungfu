package com.hhkungfu.backend.module.episode.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.hhkungfu.backend.module.anime.entity.Anime;
import com.hhkungfu.backend.module.video.enums.VideoStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "episodes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Episode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anime_id", nullable = false)
    private Anime anime;

    @Column(name = "episode_number", nullable = false)
    private Integer episodeNumber;

    @Column(length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "is_vip_only", nullable = false)
    @Builder.Default
    private Boolean isVipOnly = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "video_status", length = 20, nullable = false)
    @Builder.Default
    private VideoStatus videoStatus = VideoStatus.PENDING;

    @Column(name = "hls_path", length = 500)
    private String hlsPath;

    @Column(name = "hls_base_url", length = 500)
    private String hlsBaseUrl;

    @Column(name = "duration_seconds")
    private Double durationSeconds;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "has_vietsub", nullable = false)
    @Builder.Default
    private Boolean hasVietsub = false;

    @Column(name = "has_engsub", nullable = false)
    @Builder.Default
    private Boolean hasEngsub = false;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "aired_date")
    private java.time.LocalDate airedDate;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
