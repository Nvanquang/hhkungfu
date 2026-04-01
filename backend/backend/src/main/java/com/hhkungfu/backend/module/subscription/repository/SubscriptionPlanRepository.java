package com.hhkungfu.backend.module.subscription.repository;

import com.hhkungfu.backend.module.subscription.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    List<SubscriptionPlan> findAllByIsActiveTrueOrderBySortOrderAsc();
}
