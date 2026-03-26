import { cn } from "@/lib/utils";
import { Lock, Check, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { EpisodeItem } from "@/types/episode.types";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface EpisodeGridProps {
  animeSlug: string;
  episodes: EpisodeItem[];
  currentEpisodeNumber: number;
  progressMap?: Record<number, number>;
}

export function EpisodeGrid({ animeSlug, episodes, currentEpisodeNumber, progressMap = {} }: EpisodeGridProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isUserVip = user?.isVip ?? false;

  return (
    <div className="lg:hidden bg-black/30 border border-white/10 rounded-xl overflow-hidden">
      {/* Header with collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10"
      >
        <span className="text-sm font-semibold text-white">Danh sách tập</span>
        <span className="text-xs text-white/50">{collapsed ? "Mở rộng ▼" : "Thu gọn ▲"}</span>
      </button>

      {!collapsed && (
        <div className="p-3">
          {/* Grid of episode pills */}
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
            {episodes.map((ep) => {
              const isCurrent = ep.episodeNumber === currentEpisodeNumber;
              const isVip = ep.isVipOnly;
              const isCompleted = (progressMap[ep.id] ?? 0) >= 1;

              const isLocked = isVip && !isUserVip;

              return (
                <Link
                  key={ep.id}
                  to={isLocked ? "#" : `/watch/${animeSlug}/${ep.episodeNumber}`}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      toast.error("Yêu cầu tài khoản VIP", {
                        description: `Tập ${ep.episodeNumber} dành riêng cho VIP`,
                        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
                      });
                    }
                  }}
                  title={ep.title ?? `Tập ${ep.episodeNumber}`}
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full aspect-square rounded-lg text-xs font-medium transition-all shadow-sm",
                    "border",
                    isLocked
                      ? "bg-black/40 border-amber-900/30 text-white/30 cursor-not-allowed"
                      : isCurrent
                        ? "bg-primary/20 border-primary text-primary"
                        : isCompleted
                          ? "bg-white/5 border-white/10 text-white/40"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  {isVip && !isCurrent && (
                    <Lock className="w-3 h-3 text-amber-400 absolute top-1 right-1" />
                  )}
                  {isCompleted && !isCurrent && (
                    <Check className="w-3 h-3 text-white/30 absolute top-1 left-1" />
                  )}
                  <span>Tập {ep.episodeNumber}</span>
                  {isVip && (
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 mt-0.5" />
                  )}
                  {/* Thin progress bar at bottom */}
                  {isCurrent && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/40 rounded-b-lg" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Link to anime page */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <button
              onClick={() => navigate(`/anime/${animeSlug}`)}
              className="text-xs text-primary/80 hover:text-primary transition-colors"
            >
              Xem trang anime →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
