package com.hhkungfu.backend.module.comment.repository;

import com.hhkungfu.backend.module.comment.entity.CommentLike;
import com.hhkungfu.backend.module.comment.entity.CommentLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLikeId> {
    boolean existsById_UserIdAndId_CommentId(UUID userId, Long commentId);
    void deleteById_UserIdAndId_CommentId(UUID userId, Long commentId);
}
