import { AnimeCard } from "@/components/features/AnimeCard";
import { EmptyState, Skeleton } from "@/components/ui";
import type { AnimeSummary } from "@/types/anime.types";

interface Props {
  items: AnimeSummary[];
  isLoading: boolean;
  isError: boolean;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  refetch: () => void;
}

export function AnimeGrid({ items, isLoading, isError, hasActiveFilters, clearFilters, refetch }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Không tải được danh sách anime"
        description="Vui lòng thử lại."
        action={{ label: "Thử lại", onClick: () => refetch() }}
      />
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Không có anime phù hợp"
        description="Hãy thử thay đổi bộ lọc hoặc từ khóa."
        action={
          hasActiveFilters
            ? { label: "Xóa bộ lọc", onClick: clearFilters }
            : { label: "Về trang chủ", href: "/" }
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  );
}

// Component chính để render lưới anime, nhận items, loading/error state, hasActiveFilters, clearFilters, refetch từ page cha. Hiển thị skeleton khi loading, empty state khi error hoặc không có kết quả, và grid anime khi có data.