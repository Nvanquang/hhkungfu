// Section "Tập mới hôm nay" dạng grid 2 cột card ngang với thumbnail, tên anime, số tập và thời gian cập nhật.
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { SectionHeader } from "../SectionHeader";
import { timeAgo } from "../../home.utils";

interface RecentAnime {
  id: number;
  slug?: string | null;
  title?: string | null;
  thumbnailUrl?: string | null;
  latestEp?: number | null;
  latestEpAdded?: string | null;
}

interface Props {
  items: RecentAnime[];
  isLoading: boolean;
}

export function RecentlyUpdatedSection({ items, isLoading }: Props) {
  return (
    <section className="space-y-4">
      <SectionHeader
        title="TẬP MỚI HÔM NAY"
        icon={<Sparkles className="h-5 w-5" />}
        action={{ label: "Xem thêm", href: "/anime?sort=updatedAt&order=desc" }}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
          : items.length
            ? items.map((a) => (
              <Link
                key={a.id}
                to={`/anime/${a.slug}`}
                className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border transition-colors"
              >
                <div className="relative">
                  {a.thumbnailUrl ? (
                    <img src={a.thumbnailUrl} alt={a.title as string} className="aspect-video w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="aspect-video w-full bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold line-clamp-1">{a.title} · Tập {a.latestEp ?? "?"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.latestEpAdded ? timeAgo(a.latestEpAdded) : ""}</p>
                </div>
              </Link>
            ))
            : (
              <div className="md:col-span-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-card py-10 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">Hôm nay chưa có tập phim mới!</p>
                <p className="text-xs text-muted-foreground/60">Quay lại sau nhé, nội dung mới sẽ sớm được cập nhật.</p>
              </div>
            )}
      </div>
    </section>
  );
}