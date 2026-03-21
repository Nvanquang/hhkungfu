package com.hhkungfu.backend.module.interaction.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hhkungfu.backend.module.interaction.entity.Comment;

import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

  @Query("""
          SELECT c FROM Comment c
          JOIN FETCH c.user u
          WHERE c.episodeId = :episodeId
            AND c.parent IS NULL
            AND c.deletedAt IS NULL
      """)
  Page<Comment> findRootCommentsByEpisode(@Param("episodeId") Long episodeId, Pageable pageable);

  @Query("""
          SELECT c FROM Comment c
          JOIN FETCH c.user u
          WHERE c.parent.id = :parentId
            AND c.deletedAt IS NULL
      """)
  Page<Comment> findRepliesByParentId(@Param("parentId") Long parentId, Pageable pageable);

  Optional<Comment> findByIdAndDeletedAtIsNull(Long id);

  @Query("""
          SELECT COUNT(c) FROM Comment c
          WHERE c.parent.id = :parentId
            AND c.deletedAt IS NULL
      """)
  long countRepliesByParentId(@Param("parentId") Long parentId);
}
