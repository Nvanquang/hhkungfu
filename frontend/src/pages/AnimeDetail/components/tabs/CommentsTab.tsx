// Tab "Nhận xét": placeholder EmptyState báo tính năng đang phát triển.
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui";

export function CommentsTab() {
  const navigate = useNavigate();
  return (
    <div className="flex justify-center py-12">
      <EmptyState
        title="Tính năng đang phát triển"
        description="Hệ thống bình luận tương tác sẽ sớm ra mắt."
        action={{ label: "Khám phá anime", onClick: () => navigate("/anime") }}
      />
    </div>
  );
}