package com.hhkungfu.backend.module.video.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.hhkungfu.backend.module.episode.entity.Episode;
import com.hhkungfu.backend.module.video.enums.FileType;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_files")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episode_id", nullable = false)
    private Episode episode;

    @Column(length = 10, nullable = false)
    private String quality; // 360p, 720p

    @Column(name = "file_path", length = 500, nullable = false)
    private String filePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", length = 20, nullable = false)
    private FileType fileType;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "duration")
    private Double duration;

    @Column(name = "bitrate")
    private Long bitrate;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
