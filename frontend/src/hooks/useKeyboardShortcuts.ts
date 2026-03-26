import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

interface UseKeyboardShortcutsOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onToggleSubtitle?: () => void;
  onToggleFullscreen?: () => void;
  onSeek?: (direction: "forward" | "backward") => void;
}

export function useKeyboardShortcuts({
  videoRef,
  onToggleSubtitle,
  onToggleFullscreen,
  onSeek,
}: UseKeyboardShortcutsOptions) {
  const { setVolume, toggleMute, volume } = usePlayerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire when user is typing in input / textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          onSeek?.("backward");
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          onSeek?.("forward");
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case "KeyF":
          e.preventDefault();
          onToggleFullscreen?.();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyC":
          e.preventDefault();
          onToggleSubtitle?.();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [videoRef, volume, setVolume, toggleMute, onToggleSubtitle, onToggleFullscreen]);
}
