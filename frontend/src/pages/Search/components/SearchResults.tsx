// Hiển thị kết quả tìm kiếm dạng list card ngang, xử lý đủ 4 trạng thái: loading, lỗi, không có kết quả (kèm trending), có kết quả.
import { Link } from "react-router-dom";
import { EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AnimeSummary } from "@/types";

// interface ResultAnime {
//   id: number;
//   slug?: string | null;
//   title?: string | null;
//   thumbnailUrl?: string | null;
//   type?: string | null;
//   totalEpisodes?: number | null;
//   year?: number | null;
//   malScore?: number | null;
//   genres?: Array<{ id: number; name: string; nameVi?: string | null }>;
// }

interface TrendingAnime {
  id: number;
  title?: string | null;
}

interface Pagination {
  total: number;
}

interface Meta {
  engine?: string;
  query?: string;
}

interface Props {
  committedQ: string;
  results: AnimeSummary[];
  pagination: Pagination | undefined;
  meta: Meta | undefined;
  isLoading: boolean;
  isError: boolean;
  trending: TrendingAnime[];
  onRefetch: () => void;
  onSubmit: (key: string) => void;
}

export function SearchResults({
  committedQ, results, pagination, meta,
  isLoading, isError, trending, onRefetch, onSubmit,
}: Props) {
  if (committedQ.length === 0) {
    return (
      <EmptyState
        title="Tìm anime bạn thích"
        description="Nhập từ khóa để bắt đầu tìm kiếm."
        action={{ label: "Khám phá anime", href: "/anime" }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex gap-4">
                <Skeleton className="h-28 w-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Không tải được kết quả"
        description="Vui lòng thử lại."
        action={{ label: "Thử lại", onClick: onRefetch }}
      />
    );
  }

  if (results.length) {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Kết quả tìm kiếm cho "{committedQ}"
          </h1>
          <p className="text-sm text-muted-foreground">
            {pagination ? `Tìm thấy ${pagination.total} anime` : null}
            {meta?.engine ? ` · ${meta.engine}` : null}
          </p>
        </div>

        <div className="space-y-3">
          {results.map((a) => (
            <Link
              key={a.id}
              to={`/anime/${a.slug}`}
              className={cn("block rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors")}
            >
              <div className="flex gap-4">
                <div className="h-28 w-20 rounded-lg bg-muted overflow-hidden shrink-0">
                  {a.thumbnailUrl ? (
                    <img src={a.thumbnailUrl} alt={a.title as string} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black tracking-tight truncate">{a.title}</h3>
                    <div className="text-sm font-semibold text-muted-foreground shrink-0">⭐ {a.malScore ?? "N/A"}</div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.type}
                    {a.totalEpisodes ? ` · ${a.totalEpisodes} tập` : ""}
                    {a.year ? ` · ${a.year}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                    {a.genres?.length ? a.genres.map((g) => g.nameVi || g.name).join(" · ") : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmptyState
        title={`Không tìm thấy kết quả cho "${committedQ}"`}
        description="Thử tìm với từ khóa khác hoặc xem gợi ý bên dưới."
      />
      {trending.length ? (
        <div className="space-y-3">
          <h2 className="text-sm font-bold tracking-tight text-muted-foreground">🔥 Đang trending</h2>
          <div className="flex flex-wrap gap-2">
            {trending.slice(0, 8).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSubmit(a.title as string)}
                className="rounded-full border border-border px-3 py-1 text-sm font-semibold hover:bg-muted"
              >
                {a.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}