export interface CommentDto {
  id: number;
  content: string;
  likeCount: number;
  isPinned: boolean;
  replyCount: number;
  isLikedByMe: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number | null;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentLikeResponse {
  liked: boolean;
  likeCount: number;
}
