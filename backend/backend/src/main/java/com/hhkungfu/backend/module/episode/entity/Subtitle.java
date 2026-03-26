package com.hhkungfu.backend.module.episode.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subtitles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subtitle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "episode_id", nullable = false)
    private Episode episode;

    @Column(length = 10, nullable = false)
    private String language; // vi, en, ja

    @Column(length = 50, nullable = false)
    private String label; // Vietsub, Engsub

    @Column(length = 500, nullable = false)
    private String url;
}
