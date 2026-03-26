import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Zap, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EpisodeItem } from "@/types/episode.types";

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

interface VideoInfoProps {
  animeSlug: string;
  animeTitle: string | null;
  episode: EpisodeItem;
  prevEpisode: EpisodeItem | null;
  nextEpisode: EpisodeItem | null;
  className?: string;
}

export function VideoInfo({
  animeSlug,
  animeTitle,
  episode,
  prevEpisode,
  nextEpisode,
  className,
}: VideoInfoProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  const navLinkClass = cn(
    buttonVariants({ variant: "outline", size: "default" }),
    "bg-white/5 border-white/15 text-white/80 hover:bg-white/10 hover:text-white px-4 h-10"
  );
  const navDisabledClass = cn(
    buttonVariants({ variant: "outline", size: "default" }),
    "bg-white/5 border-white/10 text-white/30 pointer-events-none opacity-50 px-4 h-10"
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Episode title + anime */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
          Tập {episode.episodeNumber}
          {episode.title ? ` — ${episode.title}` : ""}
        </h1>
        {animeTitle && (
          <p className="text-base text-white/50 mt-1.5">
            <Link to={`/anime/${animeSlug}`} className="hover:text-primary transition-colors">
              {animeTitle}
            </Link>
          </p>
        )}
      </div>

      {/* Navigation and Player controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {prevEpisode ? (
            <Link to={`/watch/${animeSlug}/${prevEpisode.episodeNumber}`} className={navLinkClass}>
              <ChevronLeft className="w-5 h-5 mr-1" />
              Trước
            </Link>
          ) : (
            <span className={navDisabledClass}>
              <ChevronLeft className="w-5 h-5 mr-1" />
              Trước
            </span>
          )}

          {nextEpisode ? (
            <Link to={`/watch/${animeSlug}/${nextEpisode.episodeNumber}`} className={navLinkClass}>
              Tiếp
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          ) : (
            <span className={navDisabledClass}>
              Tiếp
              <ArrowRight className="w-5 h-5 ml-1" />
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
        {episode.hasVietsub && (
          <span className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" />
            Vietsub
          </span>
        )}
        {episode.hasEngsub && (
          <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
            Engsub
          </span>
        )}
        <span className="bg-white/10 border border-white/15 text-white/60 px-2 py-0.5 rounded-full">
          720p
        </span>
        {episode.durationSeconds && (
          <span className="bg-white/10 border border-white/15 text-white/60 px-2 py-0.5 rounded-full">
            {formatDuration(episode.durationSeconds)}
          </span>
        )}
      </div>

      {/* Description */}
      {episode.description && (
        <div>
          <p className={cn("text-base text-white/60 leading-relaxed", !descExpanded && "line-clamp-3")}>
            {episode.description}
          </p>
          <button
            onClick={() => setDescExpanded((v) => !v)}
            className="text-sm text-primary/80 hover:text-primary mt-2 transition-colors font-medium"
          >
            {descExpanded ? "Thu gọn" : "Xem thêm"}
          </button>
        </div>
      )}
    </div>
  );
}
