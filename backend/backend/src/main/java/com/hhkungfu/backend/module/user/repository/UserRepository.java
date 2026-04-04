package com.hhkungfu.backend.module.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.user.entity.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.hhkungfu.backend.module.user.enums.RoleType;

import java.time.ZonedDateTime;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    long countByRole(RoleType role);

    long countByCreatedAtAfter(ZonedDateTime since);

    long countByRoleAndIdNot(RoleType role, UUID id);

    List<User> findTop5ByOrderByCreatedAtDesc();
}
