// Section "Khám phá theo thể loại" gồm pill genre scrollable ngang, tiêu đề kết quả động và PaginatedGrid anime theo genre đang chọn.
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Separator, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../SectionHeader";
import { PaginatedGrid } from "../PaginatedGrid";
import type { AnimeSummary, Genre } from "@/types";

interface Props {
  genres: Genre[];
  isGenresLoading: boolean;
  effectiveGenre: string | null;
  activeGenreData: Genre | undefined;
  genreAnimes: AnimeSummary[];
  isGenreAnimesLoading: boolean;
  onSelectGenre: (slug: string | null) => void;
}

export function GenreSection({
  genres, isGenresLoading, effectiveGenre, activeGenreData,
  genreAnimes, isGenreAnimesLoading, onSelectGenre,
}: Props) {
  return (
    <section className="space-y-4">
      <SectionHeader title="KHÁM PHÁ THEO THỂ LOẠI" />

      {isGenresLoading ? (
        <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {genres.map((g) => {
            const isActive = g.slug === effectiveGenre;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectGenre(g.slug ?? null)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium border",
                  isActive
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                {g.nameVi || g.name}
              </button>
            );
          })}
        </div>
      )}

      <Separator className="opacity-60" />

      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base md:text-lg font-bold tracking-tight">
          {activeGenreData
            ? `Kết quả: Anime ${(activeGenreData.nameVi || activeGenreData.name as string).trim()}`
            : "Kết quả"}
        </h3>
        {effectiveGenre ? (
          <Link
            to={`/anime?genre=${effectiveGenre}`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            Xem tất cả <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <PaginatedGrid
        items={genreAnimes}
        isLoading={isGenreAnimesLoading}
        emptyText="Không có anime cho thể loại này."
      />
    </section>
  );
}