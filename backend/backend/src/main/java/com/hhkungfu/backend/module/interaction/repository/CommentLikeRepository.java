package com.hhkungfu.backend.module.interaction.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.interaction.entity.CommentLike;
import com.hhkungfu.backend.module.interaction.entity.CommentLikeId;

import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLikeId> {
    boolean existsById_UserIdAndId_CommentId(UUID userId, Long commentId);

    void deleteById_UserIdAndId_CommentId(UUID userId, Long commentId);
}
