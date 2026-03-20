package com.hhkungfu.backend.module.anime.repository;

import com.hhkungfu.backend.module.anime.entity.Studio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudioRepository extends JpaRepository<Studio, Long>, JpaSpecificationExecutor<Studio> {
    Optional<Studio> findByName(String name);
    boolean existsByName(String name);
}
