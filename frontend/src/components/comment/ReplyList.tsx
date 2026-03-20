import { useReplies } from "@/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { Spinner } from "@/components/ui/spinner";

interface ReplyListProps {
  commentId: number;
  onLike: (id: number) => void;
  onEdit: (id: number, content: string) => Promise<void>;
  onDelete: (id: number) => void;
}

export function ReplyList({ commentId, onLike, onEdit, onDelete }: ReplyListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useReplies(commentId);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Spinner size="sm" />
      </div>
    );
  }

  const allReplies = data?.pages.flatMap((page) => page.items) || [];

  if (allReplies.length === 0) return null;

  return (
    <div className="space-y-4 mt-2">
      {allReplies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          isReply={true}
          onLike={onLike}
          onReply={async () => {}} // Nested replies not allowed
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1"
        >
          {isFetchingNextPage ? "Đang tải..." : "Xem thêm phản hồi"}
        </button>
      )}
    </div>
  );
}
