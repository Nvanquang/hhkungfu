package com.hhkungfu.backend.module.subscription.repository;

import com.hhkungfu.backend.module.subscription.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import com.hhkungfu.backend.module.subscription.enums.SubscriptionStatus;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    @Query("SELECT s FROM UserSubscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE' AND s.expiresAt > :now ORDER BY s.expiresAt DESC")
    List<UserSubscription> findActiveSubscriptions(@Param("userId") UUID userId, @Param("now") ZonedDateTime now);

    default Optional<UserSubscription> findLatestActiveSubscription(UUID userId, ZonedDateTime now) {
        return findActiveSubscriptions(userId, now).stream().findFirst();
    }

    /**
     * Tìm gói subscription còn hiệu lực kể cả đã bị CANCELLED (nhưng chưa hết hạn).
     * Dùng để tính cộng dồn thời hạn khi user đăng ký lại sau khi hủy.
     */
    @Query("SELECT s FROM UserSubscription s WHERE s.user.id = :userId AND s.status IN ('ACTIVE', 'CANCELLED') AND s.expiresAt > :now ORDER BY s.expiresAt DESC")
    List<UserSubscription> findEffectiveSubscriptions(@Param("userId") UUID userId, @Param("now") ZonedDateTime now);

    default Optional<UserSubscription> findLatestEffectiveSubscription(UUID userId, ZonedDateTime now) {
        return findEffectiveSubscriptions(userId, now).stream().findFirst();
    }

    @Modifying
    @Query("UPDATE UserSubscription s SET s.status = 'EXPIRED' WHERE s.status IN ('ACTIVE', 'CANCELLED') AND s.expiresAt <= :now")
    int expireOverdueSubscriptions(@Param("now") ZonedDateTime now);

    boolean existsByUserIdAndStatus(UUID userId, SubscriptionStatus status);

    @Modifying
    @Query("UPDATE UserSubscription s SET s.status = 'CANCELLED' WHERE s.id IN :ids")
    void bulkCancel(@Param("ids") List<Long> ids);
}
