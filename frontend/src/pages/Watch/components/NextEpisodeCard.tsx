import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EpisodeItem } from "@/types/episode.types";

interface NextEpisodeCardProps {
  animeSlug: string;
  nextEpisode: EpisodeItem;
  /** Video element to monitor current time */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Total duration in seconds */
  durationSeconds: number;
}

const SHOW_BEFORE_END_SECONDS = 30;
const AUTO_PLAY_COUNTDOWN = 5;

export function NextEpisodeCard({
  animeSlug,
  nextEpisode,
  videoRef,
  durationSeconds,
}: NextEpisodeCardProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_PLAY_COUNTDOWN);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextEpUrl = `/watch/${animeSlug}/${nextEpisode.episodeNumber}`;

  // Navigate automatically when countdown hits 0
  useEffect(() => {
    if (!visible || dismissed) return;
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          // Navigate
          window.location.href = nextEpUrl;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [visible, dismissed, nextEpUrl]);

  // Monitor time position
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || dismissed) return;
    const remaining = (durationSeconds || video.duration) - video.currentTime;
    if (remaining <= SHOW_BEFORE_END_SECONDS && !video.paused) {
      setVisible(true);
    }
  }, [videoRef, durationSeconds, dismissed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [videoRef, handleTimeUpdate]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  if (!visible || dismissed) return null;

  return (
    <div
      className={cn(
        "absolute bottom-16 right-4 z-20 w-72",
        "bg-black/85 border border-white/20 rounded-xl shadow-2xl backdrop-blur-sm",
        "animate-in slide-in-from-right-4 fade-in duration-300"
      )}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Thumbnail */}
        {nextEpisode.thumbnailUrl && (
          <img
            src={nextEpisode.thumbnailUrl}
            alt={`Tập ${nextEpisode.episodeNumber}`}
            className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 mb-0.5">Tiếp theo</p>
          <p className="text-sm font-semibold text-white truncate">
            Tập {nextEpisode.episodeNumber}
            {nextEpisode.title ? ` "${nextEpisode.title}"` : ""}
          </p>

          {/* Auto-play countdown bar */}
          <div className="mt-2 h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${((AUTO_PLAY_COUNTDOWN - countdown) / AUTO_PLAY_COUNTDOWN) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-white/50 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pb-3 flex items-center gap-2">
        <Link
          to={nextEpUrl}
          className="flex-1 text-center text-xs font-semibold bg-primary text-white py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Xem ngay ({countdown}s)
        </Link>
      </div>
    </div>
  );
}
