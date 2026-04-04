import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { RotateCcw, RotateCw } from "lucide-react";
import { useHlsPlayer } from "@/hooks/useHlsPlayer";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePlayerStore } from "@/store/playerStore";
import { VipGate } from "./VipGate";
import { PlayerControls } from "./PlayerControls";
import { NextEpisodeCard } from "./NextEpisodeCard";
import type { StreamInfo } from "@/types/video.types";
import type { EpisodeItem } from "@/types/episode.types";

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamInfo: StreamInfo;
  episode: EpisodeItem;
  nextEpisode: EpisodeItem | null;
  animeSlug: string;
  isVipRequired: boolean;
}

export function VideoPlayer({
  videoRef,
  streamInfo,
  episode,
  nextEpisode,
  animeSlug,
  isVipRequired,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, setFullscreen } = usePlayerStore();

  const { setHlsQuality, setSubtitleTrack } = useHlsPlayer(
    isVipRequired ? null : streamInfo.masterUrl,
    videoRef
  );

  // Save watch progress + record view
  useWatchProgress(episode.id, videoRef);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, [setFullscreen]);

  const [seekOverlay, setSeekOverlay] = useState<"forward" | "backward" | null>(null);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSeek = useCallback((direction: "forward" | "backward", amount: number = 10) => {
    const video = videoRef.current;
    if (!video) return;

    const seconds = direction === "forward" ? amount : -amount;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));

    setSeekOverlay(direction);
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => setSeekOverlay(null), 600);
  }, [videoRef]);

  const toggleSubtitle = useCallback(() => {
    // Cycle through subtitle tracks
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    if (!tracks.length) return;
    let nextVisible = -1;
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].mode === "showing") { nextVisible = i + 1; break; }
    }
    if (nextVisible >= tracks.length) nextVisible = -1;
    setSubtitleTrack(nextVisible);
  }, [videoRef, setSubtitleTrack]);

  useKeyboardShortcuts({
    videoRef,
    onToggleSubtitle: toggleSubtitle,
    onToggleFullscreen: toggleFullscreen,
    onSeek: (direction: "forward" | "backward") => handleSeek(direction),
  });

  if (isVipRequired) {
    return (
      <VipGate
        thumbnailUrl={episode.thumbnailUrl}
        episodeTitle={episode.title}
        episodeNumber={episode.episodeNumber}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-video bg-black overflow-hidden",
        "group/player",
        isFullscreen && "fixed inset-0 z-[9999] aspect-auto"
      )}
    >
      {/* The actual video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
      // No 'controls' — we use custom controls
      />

      {/* Seek Click/Double-click Areas */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div
          className="flex-1 pointer-events-auto"
          onDoubleClick={() => handleSeek("backward")}
        />
        <div
          className="flex-1 pointer-events-auto"
          onDoubleClick={() => handleSeek("forward")}
        />
      </div>

      {/* Seek Visual Overlay */}
      {seekOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-8 animate-in zoom-in fade-in duration-300">
            <div className="flex flex-col items-center gap-2 text-white">
              {seekOverlay === "forward" ? (
                <>
                  <RotateCw className="w-12 h-12" />
                  <span className="text-xl font-bold">+10s</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-12 h-12" />
                  <span className="text-xl font-bold">-10s</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom controls overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
        <PlayerControls
          videoRef={videoRef}
          streamInfo={streamInfo}
          hlsControls={{ setHlsQuality, setSubtitleTrack }}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onSeek={handleSeek}
          nextEpisode={nextEpisode}
          animeSlug={animeSlug}
        />
      </div>

      {/* Next episode card — only if there's a next episode */}
      {nextEpisode && (
        <NextEpisodeCard
          animeSlug={animeSlug}
          nextEpisode={nextEpisode}
          videoRef={videoRef}
          durationSeconds={streamInfo.durationSeconds as any}
        />
      )}
    </div>
  );
}
