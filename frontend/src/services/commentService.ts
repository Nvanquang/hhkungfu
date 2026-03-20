import { api } from "./apiClient";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type {
  CommentDto,
  CommentLikeResponse,
  CreateCommentRequest,
  UpdateCommentRequest,
} from "@/types/comment.types";

export const commentService = {
  getComments: async (
    episodeId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PageResponse<CommentDto>> => {
    const { data } = await api.get<ApiResponse<PageResponse<CommentDto>>>(
      `/episodes/${episodeId}/comments`,
      {
        params: { page, limit },
      }
    );
    return data.data;
  },

  getReplies: async (
    commentId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PageResponse<CommentDto>> => {
    const { data } = await api.get<ApiResponse<PageResponse<CommentDto>>>(
      `/comments/${commentId}/replies`,
      {
        params: { page, limit },
      }
    );
    return data.data;
  },

  createComment: async (
    episodeId: number,
    payload: CreateCommentRequest
  ): Promise<CommentDto> => {
    const { data } = await api.post<ApiResponse<CommentDto>>(
      `/episodes/${episodeId}/comments`,
      payload
    );
    return data.data;
  },

  updateComment: async (
    id: number,
    payload: UpdateCommentRequest
  ): Promise<CommentDto> => {
    const { data } = await api.patch<ApiResponse<CommentDto>>(
      `/comments/${id}`,
      payload
    );
    return data.data;
  },

  deleteComment: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },

  toggleLike: async (id: number): Promise<CommentLikeResponse> => {
    const { data } = await api.post<ApiResponse<CommentLikeResponse>>(
      `/comments/${id}/like`
    );
    return data.data;
  },
};
