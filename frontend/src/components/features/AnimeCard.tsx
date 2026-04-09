import { Link } from "react-router-dom";
import { PlayCircle, Star, X } from "lucide-react";
import type { AnimeSummary } from "@/types/anime.types";
import { cn } from "@/lib/utils";

interface AnimeCardProps {
  anime: AnimeSummary;
  className?: string;
  showDetails?: boolean;
  onRemove?: (id: number) => void;
}

export function AnimeCard({ anime, className, showDetails = true, onRemove }: AnimeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "text-green-500";
      case "COMPLETED":
        return "text-muted-foreground";
      case "UPCOMING":
        return "text-amber-500";
      default:
        return "text-muted-foreground";
    }
  };

  const statusLabel = {
    ONGOING: "● Đang phát sóng",
    COMPLETED: "✓ Hoàn thành",
    UPCOMING: "◷ Sắp chiếu",
  }[anime.status] || anime.status;

  return (
    <div className={cn("group relative flex flex-col gap-2 w-full", className)}>
      <Link to={`/anime/${anime.slug}`} className="block relative aspect-[2/3] w-full rounded-md overflow-hidden bg-muted/20 transition-all duration-300 ease-out hover:-translate-y-1.5 focus-visible:-translate-y-1.5 outline-none">
        {anime.thumbnailUrl ? (
          <img
            src={anime.thumbnailUrl}
            alt={anime.titleVi as string}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Gradient Overlay for Text Readability or Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

        {/* Hover Play Overlay - Slide from bottom with Glassmorphism */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center opacity-0 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <PlayCircle className="w-14 h-14 text-white drop-shadow-md" strokeWidth={1.5} />
        </div>

        {/* VIP Badge */}
        {anime.hasVipContent && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-gradient-to-r from-amber-500 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
              ✨ VIP
            </span>
          </div>
        )}

        {/* Remove Bookmark Button (Only on Hover) */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(anime.id);
            }}
            className="absolute top-2 right-2 z-20 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
            title="Xóa khỏi bookmarks"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </Link>

      {showDetails && (
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={cn("tracking-tight", getStatusColor(anime.status))}>
              {statusLabel}
            </span>
          </div>

          <Link to={`/anime/${anime.slug}`} className="hover:text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm">
            <h3 className="font-bold text-sm leading-tight line-clamp-1 tracking-tight" title={anime.titleVi as string}>
              {anime.titleVi}
            </h3>
          </Link>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{anime.type}</span>
            {anime.totalEpisodes ? (
              <>
                <span>·</span>
                <span>{anime.totalEpisodes} tập</span>
              </>
            ) : null}
            {anime.year ? (
              <>
                <span>·</span>
                <span>{anime.year}</span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-foreground">{anime.malScore?.toFixed(2) || "N/A"}</span>
          </div>

          {anime.genres && anime.genres.length > 0 && (
            <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {anime.genres.map((g) => g.name).join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
