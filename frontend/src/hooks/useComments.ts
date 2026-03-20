import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { commentService } from "@/services/commentService";
import type { CreateCommentRequest, UpdateCommentRequest } from "@/types/comment.types";
import { toast } from "sonner";

export const COMMENT_QUERY_KEYS = {
  all: ["comments"] as const,
  byEpisode: (episodeId: number) => [...COMMENT_QUERY_KEYS.all, "episode", episodeId] as const,
  replies: (commentId: number) => [...COMMENT_QUERY_KEYS.all, "replies", commentId] as const,
};

export function useComments(episodeId: number) {
  return useInfiniteQuery({
    queryKey: COMMENT_QUERY_KEYS.byEpisode(episodeId),
    queryFn: ({ pageParam = 1 }) => commentService.getComments(episodeId, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!episodeId,
  });
}

export function useReplies(commentId: number) {
  return useInfiniteQuery({
    queryKey: COMMENT_QUERY_KEYS.replies(commentId),
    queryFn: ({ pageParam = 1 }) => commentService.getReplies(commentId, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!commentId,
  });
}

export function useCommentMutations(episodeId: number) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateCommentRequest) =>
      commentService.createComment(episodeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byEpisode(episodeId) });
      toast.success("Đã gửi bình luận!");
    },
    onError: () => toast.error("Không thể gửi bình luận. Vui lòng thử lại."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCommentRequest }) =>
      commentService.updateComment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all });
      toast.success("Đã cập nhật bình luận!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => commentService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all });
      toast.success("Đã xóa bình luận!");
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (id: number) => commentService.toggleLike(id),
    onMutate: async () => {
      // Logic for optimistic update could be complex with infinite query, 
      // focusing on simple invalidation for now to ensure correctness
      await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.all });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleLikeMutation,
  };
}
