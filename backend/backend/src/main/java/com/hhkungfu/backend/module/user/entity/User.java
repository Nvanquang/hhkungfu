package com.hhkungfu.backend.module.user.entity;

import lombok.*;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.hhkungfu.backend.module.user.enums.ProviderType;
import com.hhkungfu.backend.module.user.enums.RoleType;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password")
    private String password;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false, length = 20)
    private ProviderType provider; // LOCAL, GOOGLE

    @Column(nullable = false, length = 20)
    private RoleType role; // USER, ADMIN

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.provider == null) {
            this.provider = ProviderType.LOCAL;
        }
        if (this.role == null) {
            this.role = RoleType.USER;
        }
    }
}
