package com.hhkungfu.backend.module.admin.service;

import com.hhkungfu.backend.common.constant.RedisKeys;
import com.hhkungfu.backend.common.exception.BusinessException;
import com.hhkungfu.backend.common.exception.ErrorConstants;
import com.hhkungfu.backend.common.exception.ResourceNotFoundException;
import com.hhkungfu.backend.common.exception.UnauthorizedException;
import com.hhkungfu.backend.common.response.PageResponse;
import com.hhkungfu.backend.common.util.SecurityUtil;
import com.hhkungfu.backend.module.admin.dto.request.PatchUserStatusRequest;
import com.hhkungfu.backend.module.admin.dto.response.AdminUserDto;
import com.hhkungfu.backend.module.admin.dto.response.AdminUserListDataDto;
import com.hhkungfu.backend.module.subscription.repository.UserSubscriptionRepository;
import com.hhkungfu.backend.module.user.entity.User;
import com.hhkungfu.backend.module.user.enums.RoleType;
import com.hhkungfu.backend.module.user.repository.UserRepository;
import com.hhkungfu.backend.module.user.repository.WatchHistoryRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Date;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final UserRepository userRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final StringRedisTemplate redisTemplate;

    @Transactional(readOnly = true)
    public AdminUserListDataDto listUsers(int page, int limit, String search, Boolean isActive) {
        Specification<User> spec = buildSpec(search, isActive);
        PageRequest pr = PageRequest.of(Math.max(page - 1, 0), limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> result = userRepository.findAll(spec, pr);

        List<User> content = result.getContent();
        List<UUID> ids = content.stream().map(User::getId).toList();

        Map<UUID, Long> watchByUser = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : watchHistoryRepository.countByUserIds(ids)) {
                watchByUser.put((UUID) row[0], (Long) row[1]);
            }
        }

        Map<UUID, ZonedDateTime> vipExpiry = new HashMap<>();
        if (!ids.isEmpty()) {
            for (Object[] row : userSubscriptionRepository.findLatestVipExpiryForUserIds(ids)) {
                ZonedDateTime expiry = toZonedDateTime(row[1]);
                if (expiry != null) {
                    vipExpiry.put((UUID) row[0], expiry);
                }
            }
        }

        List<AdminUserDto> items = content.stream()
                .map(u -> toDto(u, watchByUser.getOrDefault(u.getId(), 0L), vipExpiry.get(u.getId())))
                .toList();

        return AdminUserListDataDto.builder()
                .items(items)
                .pagination(PageResponse.PaginationMeta.builder()
                        .page(page)
                        .limit(limit)
                        .total(result.getTotalElements())
                        .totalPages(result.getTotalPages())
                        .build())
                .build();
    }

    private AdminUserDto toDto(User u, long totalWatched, ZonedDateTime vipExpiresAt) {
        boolean isVip = vipExpiresAt != null;
        return AdminUserDto.builder()
                .id(u.getId())
                .email(u.getEmail())
                .username(u.getUsername())
                .avatarUrl(u.getAvatarUrl())
                .role(u.getRole())
                .isActive(u.isActive())
                .emailVerified(u.isEmailVerified())
                .provider(u.getProvider())
                .isVip(isVip)
                .vipExpiresAt(vipExpiresAt)
                .totalWatched(totalWatched)
                .createdAt(u.getCreatedAt())
                .build();
    }

    private Specification<User> buildSpec(String search, Boolean isActive) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("email")), like),
                        cb.like(cb.lower(root.get("username")), like)));
            }
            if (isActive != null) {
                predicates.add(cb.equal(root.get("isActive"), isActive));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    @Transactional
    public void updateStatus(UUID targetId, PatchUserStatusRequest request) {
        UUID callerId = SecurityUtil.getCurrentUserId()
                .map(UUID::fromString)
                .orElseThrow(() -> new UnauthorizedException("Unauthorized", HttpStatus.UNAUTHORIZED,
                        ErrorConstants.UNAUTHORIZED.getCode()));

        if (targetId.equals(callerId)) {
            throw new BusinessException("Không thể thay đổi trạng thái của chính mình", "USER",
                    ErrorConstants.CANNOT_MODIFY_SELF.getCode());
        }

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng", "USER",
                        ErrorConstants.USER_NOT_FOUND.getCode()));

        if (target.getRole() == RoleType.ADMIN) {
            throw new BusinessException("Không thể thay đổi trạng thái của admin", "USER",
                    ErrorConstants.CANNOT_MODIFY_ADMIN.getCode());
        }

        target.setActive(request.isActive());
        userRepository.save(target);

        if (!request.isActive()) {
            redisTemplate.delete(RedisKeys.refresh(targetId.toString()));
        }
    }

    private ZonedDateTime toZonedDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof ZonedDateTime zdt) {
            return zdt.withZoneSameInstant(ZONE);
        }
        if (value instanceof OffsetDateTime odt) {
            return odt.toZonedDateTime().withZoneSameInstant(ZONE);
        }
        if (value instanceof Instant instant) {
            return instant.atZone(ZONE);
        }
        if (value instanceof Date date) {
            return date.toInstant().atZone(ZONE);
        }
        if (value instanceof LocalDateTime ldt) {
            return ldt.atZone(ZONE);
        }
        throw new IllegalStateException("Kiểu dữ liệu không hỗ trợ: " + value.getClass().getName());
    }
}
