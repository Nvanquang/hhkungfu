package com.hhkungfu.backend.module.anime.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "studios")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Studio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String name;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;
}
