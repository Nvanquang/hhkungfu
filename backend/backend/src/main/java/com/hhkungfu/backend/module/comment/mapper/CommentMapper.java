package com.hhkungfu.backend.module.comment.mapper;

import com.hhkungfu.backend.module.comment.dto.CommentDto;
import com.hhkungfu.backend.module.comment.entity.Comment;
import com.hhkungfu.backend.module.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(target = "user", source = "user")
    @Mapping(target = "replyCount", ignore = true)
    @Mapping(target = "isLikedByMe", ignore = true)
    CommentDto toDto(Comment comment);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "username", source = "username")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    CommentDto.UserSummary toUserSummary(User user);
}
