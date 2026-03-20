import { useComments, useCommentMutations } from "@/hooks/useComments";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { MessageSquareOff } from "lucide-react";

interface CommentSectionProps {
  episodeId: number;
}

export function CommentSection({ episodeId }: CommentSectionProps) {
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useComments(episodeId);

  const { 
    createMutation, 
    updateMutation, 
    deleteMutation, 
    toggleLikeMutation 
  } = useCommentMutations(episodeId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="lg" />
        <span className="text-sm text-muted-foreground animate-pulse">
          Đang tải bình luận...
        </span>
      </div>
    );
  }

  const allComments = data?.pages.flatMap((page) => page.items) || [];
  const totalComments = data?.pages[0]?.pagination.total || 0;

  const handleCreateComment = async (content: string) => {
    await createMutation.mutateAsync({ content });
  };

  const handleCreateReply = async (parentId: number, content: string) => {
    await createMutation.mutateAsync({ content, parentId });
  };

  const handleUpdateComment = async (id: number, content: string) => {
    await updateMutation.mutateAsync({ id, payload: { content } });
  };

  const handleDeleteComment = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleLike = (id: number) => {
    toggleLikeMutation.mutate(id);
  };

  return (
    <div className="space-y-8 py-6">
      <div className="flex items-center justify-between border-b border-border/10 pb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          BÌNH LUẬN
          <span className="text-sm text-muted-foreground font-normal">
            ({totalComments})
          </span>
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sắp xếp:</span>
          <select className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer hover:text-primary transition-colors">
            <option className="bg-background text-foreground">Mới nhất</option>
            <option className="bg-background text-foreground">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Main Comment Input */}
      <CommentInput onSubmit={handleCreateComment} />

      {/* Comment List */}
      <div className="space-y-6">
        {allComments.length > 0 ? (
          allComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={handleToggleLike}
              onReply={handleCreateReply}
              onEdit={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground grayscale opacity-50">
            <MessageSquareOff className="w-12 h-12 mb-4 stroke-[1.5]" />
            <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          </div>
        )}

        {/* Load More */}
        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="px-8"
            >
              {isFetchingNextPage ? <Spinner size="sm" className="mr-2" /> : null}
              {isFetchingNextPage ? "Đang tải thêm..." : "Xem thêm bình luận"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
