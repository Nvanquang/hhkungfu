// Tab "Nhận xét": tích hợp hệ thống bình luận thực tế.
import { CommentSection } from "@/components/comment/CommentSection";

interface CommentsTabProps {
  episodeId: number;
}

export function CommentsTab({ episodeId }: CommentsTabProps) {
  return (
    <div className="w-full">
      <CommentSection episodeId={episodeId} />
    </div>
  );
}