import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture2,
  RotateCcw, RotateCw, SkipForward
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { QualitySelector } from "./QualitySelector";
import { SubtitleSelector } from "./SubtitleSelector";
import type { StreamInfo } from "@/types/video.types";
import type { EpisodeItem } from "@/types/episode.types";
import type { HlsPlayerControls } from "@/hooks/useHlsPlayer";

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

interface PlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamInfo: StreamInfo;
  hlsControls: Pick<HlsPlayerControls, "setHlsQuality" | "setSubtitleTrack">;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSeek?: (direction: "forward" | "backward") => void;
  nextEpisode: EpisodeItem | null;
  animeSlug: string;
}

export function PlayerControls({
  videoRef,
  streamInfo,
  hlsControls,
  isFullscreen,
  onToggleFullscreen,
  onSeek,
  nextEpisode,
  animeSlug,
}: PlayerControlsProps) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { volume, isMuted, currentQuality, activeSubtitle, setVolume, toggleMute, setActiveSubtitle } = usePlayerStore();

  // Sync play state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => { if (!isSeeking) setCurrentTime(video.currentTime); };
    const onLoaded = () => setDuration(video.duration);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("durationchange", onLoaded);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("durationchange", onLoaded);
    };
  }, [videoRef, isSeeking]);

  // Auto-hide controls after 3s of inactivity
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  }, [isPlaying]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    onSeek?.(seconds > 0 ? "forward" : "backward");
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const t = Number(e.target.value);
    setCurrentTime(t);
    video.currentTime = t;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const handlePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch { /* no-op */ }
  };

  const handleQualitySelect = (_quality: string, levelIndex: number) => {
    hlsControls.setHlsQuality(levelIndex);
  };

  const handleSubtitleSelect = (trackIndex: number, language: string) => {
    hlsControls.setSubtitleTrack(trackIndex);
    setActiveSubtitle(language);
  };

  const handleNextEpisode = () => {
    if (nextEpisode) {
      navigate(`/watch/${animeSlug}/${nextEpisode.episodeNumber}`);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pos = (x / rect.width) * 100;
    const time = (x / rect.width) * duration;
    setHoverPos(Math.max(0, Math.min(100, pos)));
    setHoverTime(Math.max(0, Math.min(duration, time)));
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="absolute inset-0 flex flex-col"
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      {/* Click area to play/pause */}
      <div className="flex-1 cursor-pointer" onClick={handlePlayPause} />

      {/* Controls bar — slides in/out */}
      <div
        className={cn(
          "transition-all duration-300",
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {/* Progress / seek bar */}
        <div className="px-3 pb-1">
          <div 
            className="relative h-1.5 group/seek"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Hover tooltip */}
            {hoverTime !== null && (
              <div 
                className="absolute bottom-full mb-2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] font-bold rounded border border-white/20 whitespace-nowrap pointer-events-none z-10"
                style={{ left: `${hoverPos}%` }}
              >
                {formatTime(hoverTime)}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
              </div>
            )}

            {/* Background track */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-white/20 rounded-full group-hover/seek:h-1.5 transition-all" />
            {/* Played portion */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full pointer-events-none group-hover/seek:h-1.5 transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* Seek thumb (nub) */}
            <div 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0 h-0 bg-primary rounded-full shadow-lg transition-all duration-200 pointer-events-none",
                "group-hover/seek:w-3.5 group-hover/seek:h-3.5",
                isSeeking && "w-3.5 h-3.5"
              )}
              style={{ left: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>
        </div>

        {/* Bottom controls row */}
        <div className="px-3 pb-3 flex items-center justify-between gap-2">
          {/* Left group */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button onClick={handlePlayPause} className="text-white hover:text-primary transition-colors" title={isPlaying ? "Pause" : "Play"}>
              {isPlaying
                ? <Pause className="w-5 h-5 fill-current" />
                : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip Backend */}
            <button onClick={() => handleSkip(-10)} className="text-white/80 hover:text-white transition-colors" title="Lùi 10s">
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Skip Forward */}
            <button onClick={() => handleSkip(10)} className="text-white/80 hover:text-white transition-colors" title="Tiến 10s">
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors" title="Mute">
                {isMuted || volume === 0
                  ? <VolumeX className="w-5 h-5" />
                  : <Volume2 className="w-5 h-5" />}
              </button>
              <div className="hidden sm:block relative w-16 h-1 group/vol-bar">
                <div className="absolute inset-0 bg-white/20 rounded-full" />
                <div
                  className="absolute top-0 left-0 h-full bg-white rounded-full pointer-events-none"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-sm text-white/70 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right group */}
          <div className="flex items-center gap-2">
            {/* Next Episode Button */}
            <button
              onClick={handleNextEpisode}
              disabled={!nextEpisode}
              className={cn(
                "transition-colors p-0.5",
                nextEpisode ? "text-white hover:text-primary" : "text-white/20 pointer-events-none"
              )}
              title={nextEpisode ? `Tập tiếp theo (Tập ${nextEpisode.episodeNumber})` : "Không có tập tiếp theo"}
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Subtitle selector */}
            <SubtitleSelector
              subtitles={streamInfo.subtitles}
              activeLanguage={activeSubtitle}
              onSelect={handleSubtitleSelect}
            />

            {/* Quality selector */}
            <QualitySelector
              qualities={streamInfo.qualities}
              currentQuality={currentQuality}
              onSelect={handleQualitySelect}
            />

            {/* PiP */}
            <button onClick={handlePiP} className="text-white/70 hover:text-white transition-colors hidden sm:block" title="Picture-in-Picture">
              <PictureInPicture2 className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button onClick={onToggleFullscreen} className="text-white/80 hover:text-white transition-colors" title="Fullscreen">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
