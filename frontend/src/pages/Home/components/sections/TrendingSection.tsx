// Section "Đang thịnh hành" hiển thị PaginatedGrid các anime có viewCount cao nhất.
import { Flame } from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import { PaginatedGrid } from "../PaginatedGrid";
import type { AnimeSummary } from "@/types";

interface Props {
  items: AnimeSummary[];
  isLoading: boolean;
}

export function TrendingSection({ items, isLoading }: Props) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="ĐANG THỊNH HÀNH"
        icon={<Flame className="h-5 w-5" />}
        action={{ label: "Xem tất cả", href: "/anime?sort=viewCount&order=desc" }}
      />
      <PaginatedGrid
        items={items}
        isLoading={isLoading}
        emptyText="Chưa có dữ liệu trending."
      />
    </section>
  );
}