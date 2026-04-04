package com.hhkungfu.backend.module.subscription.repository;

import com.hhkungfu.backend.module.subscription.entity.Payment;
import com.hhkungfu.backend.module.subscription.enums.PaymentStatus;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.orderCode = :orderCode")
    Optional<Payment> findByOrderCodeWithLock(@Param("orderCode") String orderCode);

    Optional<Payment> findByOrderCode(String orderCode);

    @Query("SELECT p.subscription.id FROM Payment p WHERE p.status = 'PENDING' AND p.expiredAt < :now")
    List<Long> findExpiredPendingSubIds(@Param("now") ZonedDateTime now);

    @Modifying
    @Query("UPDATE Payment p SET p.status = 'EXPIRED' WHERE p.status = 'PENDING' AND p.expiredAt < :now")
    int expireStalePayments(@Param("now") ZonedDateTime now);

    boolean existsByUserIdAndSubscription_Plan_IdAndStatus(java.util.UUID userId, Long planId, PaymentStatus status);

    Page<Payment> findAllByUserIdOrderByCreatedAtDesc(java.util.UUID userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.user.id = :userId AND p.status = :status")
    List<Payment> findAllByUserIdAndStatusWithLock(@Param("userId") java.util.UUID userId, @Param("status") PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PAID' AND p.paidAt >= :from AND p.paidAt < :to")
    BigDecimal sumPaidAmountBetween(@Param("from") ZonedDateTime from, @Param("to") ZonedDateTime to);
}
