package com.hhkungfu.backend.module.interaction.service;

import com.hhkungfu.backend.common.exception.BadRequestAlertException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ForbiddenException;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.interaction.dto.*;
import com.hhkungfu.backend.module.interaction.entity.Comment;
import com.hhkungfu.backend.module.interaction.entity.CommentLike;
import com.hhkungfu.backend.module.interaction.entity.CommentLikeId;
import com.hhkungfu.backend.module.interaction.mapper.CommentMapper;
import com.hhkungfu.backend.module.interaction.repository.CommentLikeRepository;
import com.hhkungfu.backend.module.interaction.repository.CommentRepository;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    @Transactional(readOnly = true)
    public PageResponse<CommentDto> getCommentsByEpisode(Long episodeId, UUID userId, Pageable pageable) {
        Page<Comment> page = commentRepository.findRootCommentsByEpisode(episodeId, pageable);

        List<CommentDto> dtos = page.getContent().stream()
                .map(comment -> {
                    CommentDto dto = commentMapper.toDto(comment);
                    dto.setReplyCount(commentRepository.countRepliesByParentId(comment.getId()));
                    if (userId != null) {
                        dto.setIsLikedByMe(
                                commentLikeRepository.existsById_UserIdAndId_CommentId(userId, comment.getId()));
                    }
                    return dto;
                })
                .toList();

        return PageResponse.<CommentDto>builder()
                .items(dtos)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(pageable.getPageNumber() + 1)
                        .limit(pageable.getPageSize())
                        .total(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentDto> getReplies(Long commentId, UUID userId, Pageable pageable) {
        Page<Comment> page = commentRepository.findRepliesByParentId(commentId, pageable);

        List<CommentDto> dtos = page.getContent().stream()
                .map(comment -> {
                    CommentDto dto = commentMapper.toDto(comment);
                    if (userId != null) {
                        dto.setIsLikedByMe(
                                commentLikeRepository.existsById_UserIdAndId_CommentId(userId, comment.getId()));
                    }
                    return dto;
                })
                .toList();

        return PageResponse.<CommentDto>builder()
                .items(dtos)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(pageable.getPageNumber() + 1)
                        .limit(pageable.getPageSize())
                        .total(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .build())
                .build();
    }

    @Transactional
    public CommentDto createComment(Long episodeId, UUID userId, CreateCommentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found", "USER", ErrorConstants.USER_NOT_FOUND.getCode()));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .episodeId(episodeId)
                .user(user)
                .build();

        if (request.getParentId() != null) {
            Comment parent = commentRepository.findByIdAndDeletedAtIsNull(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found", "COMMENT",
                            ErrorConstants.COMMENT_NOT_FOUND.getCode()));

            if (parent.getParent() != null) {
                throw new BadRequestAlertException("Nested reply not allowed", HttpStatus.BAD_REQUEST, ErrorConstants.NESTED_REPLY_NOT_ALLOWED.getCode());
            }

            if (!parent.getEpisodeId().equals(episodeId)) {
                throw new BadRequestAlertException("Parent comment belongs to another episode", HttpStatus.BAD_REQUEST, ErrorConstants.VALIDATION_ERROR.getCode());
            }

            comment.setParent(parent);
        }

        Comment savedComment = commentRepository.save(comment);
        return commentMapper.toDto(savedComment);
    }

    @Transactional
    public CommentDto updateComment(Long id, UUID userId, UpdateCommentRequest request) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found", "COMMENT", ErrorConstants.COMMENT_NOT_FOUND.getCode()));

        if (!comment.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied", HttpStatus.FORBIDDEN, ErrorConstants.FORBIDDEN.getCode());
        }

        comment.setContent(request.getContent());
        return commentMapper.toDto(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long id, UUID userId, String role) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found", "COMMENT", ErrorConstants.COMMENT_NOT_FOUND.getCode()));

        if (!comment.getUser().getId().equals(userId) && !"ADMIN".equals(role)) {
            throw new ForbiddenException("Access denied", HttpStatus.FORBIDDEN, ErrorConstants.FORBIDDEN.getCode());
        }

        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }

    @Transactional
    public CommentLikeResponse toggleLike(Long id, UUID userId) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found", "COMMENT", "COMMENT_NOT_FOUND"));

        CommentLikeId likeId = new CommentLikeId(userId, id);
        boolean alreadyLiked = commentLikeRepository.existsById(likeId);

        if (alreadyLiked) {
            commentLikeRepository.deleteById(likeId);
            comment.setLikeCount(comment.getLikeCount() - 1);
            commentRepository.save(comment);
            return CommentLikeResponse.builder().liked(false).likeCount(comment.getLikeCount()).build();
        } else {
            commentLikeRepository.save(CommentLike.builder().id(likeId).build());
            comment.setLikeCount(comment.getLikeCount() + 1);
            commentRepository.save(comment);
            return CommentLikeResponse.builder().liked(true).likeCount(comment.getLikeCount()).build();
        }
    }
}
