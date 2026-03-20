// Tab "Nhận xét": tích hợp hệ thống bình luận thực tế.
import { CommentSection } from "@/components/comment/CommentSection";

export function CommentsTab() {
  // Demo với episodeId = 1 vì Watch page chưa được định vị chính xác trong flow hiện tại
  const demoEpisodeId = 1;

  return (
    <div className="max-w-4xl mx-auto">
      <CommentSection episodeId={demoEpisodeId} />
    </div>
  );
}