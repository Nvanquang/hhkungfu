package com.hhkungfu.backend.module.admin.service;

import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.module.admin.dto.AdminCommentDto;
import com.hhkungfu.backend.module.episode.entity.Episode;
import com.hhkungfu.backend.module.episode.repository.EpisodeRepository;
import com.hhkungfu.backend.module.interaction.entity.Comment;
import com.hhkungfu.backend.module.interaction.mapper.CommentMapper;
import com.hhkungfu.backend.module.interaction.repository.CommentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCommentService {

    private final CommentRepository commentRepository;
    private final EpisodeRepository episodeRepository;
    private final CommentMapper commentMapper;

    @Transactional(readOnly = true)
    public PageResponse<AdminCommentDto> getAllCommentsManaged(
            String content, String username, Long animeId,
            String type, Boolean isDeleted, Pageable pageable) {

        Specification<Comment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (content != null && !content.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("content")), "%" + content.toLowerCase() + "%"));
            }

            if (username != null && !username.trim().isEmpty()) {
                // JOIN with owner user
                predicates.add(cb.like(cb.lower(root.get("user").get("username")), "%" + username.toLowerCase() + "%"));
            }

            if (type != null) {
                switch (type.toLowerCase()) {
                    case "root" -> predicates.add(cb.isNull(root.get("parent")));
                    case "reply" -> predicates.add(cb.isNotNull(root.get("parent")));
                    case "pinned" -> predicates.add(cb.isTrue(root.get("isPinned")));
                }
            }

            if (isDeleted != null) {
                if (isDeleted) {
                    predicates.add(cb.isNotNull(root.get("deletedAt")));
                } else {
                    predicates.add(cb.isNull(root.get("deletedAt")));
                }
            }

            if (animeId != null) {
                // Special handling: find episodes of anime
                // This is a bit expensive in Specification, but for admin it's fine
                // Alternatively use a subquery if episodeId was a relationship
                // Since it's a raw Long, we'll fetch IDs first or use criteria subquery
                var subquery = query.subquery(Long.class);
                var epRoot = subquery.from(Episode.class);
                subquery.select(epRoot.get("id"))
                        .where(cb.equal(epRoot.get("anime").get("id"), animeId));
                predicates.add(root.get("episodeId").in(subquery));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Comment> page = commentRepository.findAll(spec, pageable);

        // Enrich with Episode and Anime info
        Set<Long> episodeIds = page.getContent().stream()
                .map(Comment::getEpisodeId)
                .collect(Collectors.toSet());

        Map<Long, Episode> episodeMap = new HashMap<>();
        if (!episodeIds.isEmpty()) {
            episodeRepository.findAllById(episodeIds).forEach(ep -> episodeMap.put(ep.getId(), ep));
        }

        List<AdminCommentDto> dtos = page.getContent().stream()
                .map(comment -> {
                    AdminCommentDto dto = new AdminCommentDto();
                    dto.setId(comment.getId());
                    dto.setContent(comment.getContent());
                    dto.setLikeCount(comment.getLikeCount());
                    dto.setIsPinned(comment.getIsPinned());
                    dto.setCreatedAt(comment.getCreatedAt());
                    dto.setDeletedAt(comment.getDeletedAt());
                    dto.setUser(commentMapper.toUserSummary(comment.getUser()));
                    dto.setEpisodeId(comment.getEpisodeId());
                    dto.setParentId(comment.getParent() != null ? comment.getParent().getId() : null);
                    dto.setReplyCount(commentRepository.countRepliesByParentId(comment.getId()));

                    Episode ep = episodeMap.get(comment.getEpisodeId());
                    if (ep != null) {
                        dto.setEpisodeNumber(ep.getEpisodeNumber());
                        dto.setAnimeName(ep.getAnime().getTitle());
                        dto.setAnimeId(ep.getAnime().getId());
                    }

                    return dto;
                })
                .collect(Collectors.toList());

        return PageResponse.<AdminCommentDto>builder()
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
    public void togglePin(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận", "COMMENT",
                        ErrorConstants.COMMENT_NOT_FOUND.getCode()));

        if (comment.getParent() != null) {
            throw new com.hhkungfu.backend.common.exception.BadRequestAlertException(
                    "Không thể ghim bình luận trả lời", HttpStatus.BAD_REQUEST, "CANNOT_PIN_REPLY");
        }

        if (Boolean.TRUE.equals(comment.getIsPinned())) {
            comment.setIsPinned(false);
        } else {
            // Unpin others in same episode
            commentRepository.findByEpisodeIdAndIsPinnedTrue(comment.getEpisodeId())
                    .ifPresent(p -> {
                        p.setIsPinned(false);
                        commentRepository.save(p);
                    });
            comment.setIsPinned(true);
        }
        commentRepository.save(comment);
    }

    @Transactional
    public void deleteComment(Long id) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bình luận", "COMMENT",
                        ErrorConstants.COMMENT_NOT_FOUND.getCode()));

        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }
}
