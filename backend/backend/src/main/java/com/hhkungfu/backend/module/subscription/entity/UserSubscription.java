package com.hhkungfu.backend.module.subscription.entity;

import com.hhkungfu.backend.module.subscription.enums.SubscriptionStatus;
import com.hhkungfu.backend.module.subscription.enums.SubscriptionType;
import com.hhkungfu.backend.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Entity
@Table(name = "user_subscriptions", indexes = {
    @Index(name = "idx_sub_user_status", columnList = "user_id, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20)
    private SubscriptionType type;

    @Column(name = "started_at")
    private ZonedDateTime startedAt;

    @Column(name = "expires_at")
    private ZonedDateTime expiresAt;

    @Column(name = "paid_price", precision = 12, scale = 0)
    private BigDecimal paidPrice;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "previous_sub_id")
    private Long previousSubscriptionId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
