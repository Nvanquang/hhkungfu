package com.hhkungfu.backend.module.anime.entity;

import com.hhkungfu.backend.module.anime.enums.AgeRating;
import com.hhkungfu.backend.module.anime.enums.AnimeStatus;
import com.hhkungfu.backend.module.anime.enums.AnimeType;
import com.hhkungfu.backend.module.anime.enums.Season;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "animes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Anime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "title_vi", length = 255)
    private String titleVi;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "title_other", columnDefinition = "text[]")
    private List<String> titleOther;

    @Column(nullable = false, length = 255, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "banner_url", length = 500)
    private String bannerUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AnimeStatus status = AnimeStatus.UPCOMING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AnimeType type = AnimeType.TV;

    @Column(name = "total_episodes")
    private Integer totalEpisodes;

    @Column(name = "episode_duration")
    private Integer episodeDuration;

    @Column(name = "aired_from")
    private LocalDate airedFrom;

    @Column(name = "aired_to")
    private LocalDate airedTo;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Season season;

    private Short year;

    @Column(name = "age_rating", length = 10)
    private AgeRating ageRating;

    @Column(name = "mal_score", precision = 4, scale = 2)
    private BigDecimal malScore;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "has_vip_content", nullable = false)
    @Builder.Default
    private Boolean hasVipContent = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "anime_genres",
        joinColumns = @JoinColumn(name = "anime_id"),
        inverseJoinColumns = @JoinColumn(name = "genre_id")
    )
    @Builder.Default
    private Set<Genre> genres = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "anime_studios",
        joinColumns = @JoinColumn(name = "anime_id"),
        inverseJoinColumns = @JoinColumn(name = "studio_id")
    )
    @Builder.Default
    private Set<Studio> studios = new HashSet<>();

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
