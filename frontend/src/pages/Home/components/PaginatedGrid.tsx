// Grid 6 cột có nút prev/next để phân trang client-side, dùng chung cho section trending và theo thể loại.
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimeCard } from "@/components/features/AnimeCard";
import { Skeleton } from "@/components/ui";
import type { AnimeSummary } from "@/types";

interface Props {
  items: AnimeSummary[];
  pageSize?: number;
  isLoading?: boolean;
  skeletonCount?: number;
  emptyText?: string;
}

export function PaginatedGrid({
  items,
  pageSize = 6,
  isLoading = false,
  skeletonCount = 6,
  emptyText = "Không có dữ liệu.",
}: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(items.length / pageSize);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const visible = items.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="relative px-4">
      {safePage > 0 && (
        <button
          type="button"
          onClick={() => setPage((p) => p - 1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/60 border border-border/50 text-muted-foreground hover:bg-background hover:text-foreground hover:border-border transition-all flex items-center justify-center shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {visible.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>

      {safePage < totalPages - 1 && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-background/60 border border-border/50 text-muted-foreground hover:bg-background hover:text-foreground hover:border-border transition-all flex items-center justify-center shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}