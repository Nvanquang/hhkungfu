package com.hhkungfu.backend.module.video.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.hhkungfu.backend.module.episode.entity.Episode;
import com.hhkungfu.backend.module.video.enums.TranscodeJobStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "transcode_jobs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TranscodeJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episode_id", nullable = false)
    private Episode episode;

    @Column(length = 20, nullable = false)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private TranscodeJobStatus status = TranscodeJobStatus.QUEUED;

    @Column(nullable = false)
    @Builder.Default
    private Short progress = 0;

    @Column(name = "current_step", length = 100)
    private String currentStep;

    @Column(name = "input_path", length = 500, nullable = false)
    private String inputPath;

    @Column(name = "output_dir", length = 500)
    private String outputDir;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
