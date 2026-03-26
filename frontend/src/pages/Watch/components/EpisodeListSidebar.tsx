import { cn } from "@/lib/utils";
import { Lock, Check, Sparkles, Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { EpisodeItem } from "@/types/episode.types";
import { formatDuration } from "@/utils/format";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface EpisodeListSidebarProps {
  animeSlug: string;
  animeTitle: string | null;
  episodes: EpisodeItem[];
  currentEpisodeNumber: number;
  isLoading?: boolean;
  /** episodeId → progress fraction (0–1) for watched episodes */
  progressMap?: Record<number, number>;
}

export function EpisodeListSidebar({
  animeSlug,
  animeTitle,
  episodes,
  currentEpisodeNumber,
  isLoading,
  progressMap = {},
}: EpisodeListSidebarProps) {
  const { user } = useAuthStore();
  const isUserVip = user?.isVip ?? false;

  return (
    <aside className="hidden lg:flex flex-col w-80 min-h-0 bg-black/40 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <p className="text-sm font-semibold text-white truncate">
          {animeTitle ?? "Danh sách tập"}
        </p>
        <p className="text-xs text-white/50 mt-0.5">{episodes.length} tập</p>
      </div>

      {/* Episode list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-3 py-3 border-b border-white/5 animate-pulse">
              <div className="h-3 w-1/2 bg-white/10 rounded mb-2" />
              <div className="h-2 w-1/3 bg-white/5 rounded" />
            </div>
          ))
          : episodes.map((ep) => {
            const isCurrent = ep.episodeNumber === currentEpisodeNumber;
            const isVip = ep.isVipOnly;
            const isReady = ep.videoStatus === "READY";
            const progress = progressMap[ep.id] ?? 0;
            const hasProgress = progress > 0 && progress < 1;
            const isCompleted = progress >= 1;

            const isLocked = isVip && !isUserVip;

            return (
              <Link
                key={ep.id}
                to={isLocked ? "#" : `/watch/${animeSlug}/${ep.episodeNumber}`}
                onClick={(e) => {
                  if (isLocked) {
                    e.preventDefault();
                    toast.error("Tập phim này yêu cầu tài khoản VIP", {
                      description: "Hãy nâng cấp tài khoản để xem ngay!",
                      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                    });
                  }
                }}
                className={cn(
                  "block px-3 py-3 border-b border-white/5 transition-colors",
                  isLocked ? "bg-black/20 opacity-60 cursor-not-allowed" : "hover:bg-white/5",
                  isCurrent && "bg-primary/10 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-start gap-2">
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {isVip && !isCurrent ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400/70" />
                    ) : isCurrent ? (
                      <Play className="w-3.5 h-3.5 text-primary fill-primary" />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5 text-white/40" />
                    ) : (
                      <div className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-sm font-medium truncate",
                          isCurrent ? "text-white" : isVip && !isReady ? "text-white/40" : "text-white/70",
                          isCompleted && !isCurrent && "text-white/40"
                        )}
                      >
                        Tập {ep.episodeNumber}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] text-primary font-normal">◀ NOW</span>
                        )}
                      </span>
                      {isVip && (
                        <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      )}
                    </div>

                    {ep.title && (
                      <p
                        className={cn(
                          "text-xs truncate mt-0.5",
                          isCurrent ? "text-white/70" : "text-white/40"
                        )}
                      >
                        {ep.title}
                      </p>
                    )}

                    {ep.durationSeconds && (
                      <p className="text-xs text-white/30 mt-0.5">
                        {formatDuration(ep.durationSeconds)}
                      </p>
                    )}

                    {/* Progress bar for episode being watched */}
                    {(isCurrent || hasProgress) && (
                      <div className="mt-1.5 h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
      </div>

      {/* Link back to anime detail */}
      <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
        <Link
          to={`/anime/${animeSlug}`}
          className="text-xs text-primary/80 hover:text-primary transition-colors"
        >
          Xem trang anime →
        </Link>
      </div>
    </aside>
  );
}
