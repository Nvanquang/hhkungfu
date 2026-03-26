import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { watchService } from "@/services/watchService";

export function useWatchProgress(
  episodeId: number | null | undefined,
  videoRef: React.RefObject<HTMLVideoElement | null>
) {
  const { isLoggedIn } = useAuthStore();
  const hasFiredView = useRef(false);
  const lastSavedTimeRef = useRef<number>(0);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progressMutation = useMutation({
    mutationFn: watchService.saveProgress,
    onError: () => { }, // Silently fail
  });

  const saveToBackend = useCallback((time: number, force: boolean = false) => {
    if (!episodeId || !isLoggedIn) return;

    // Only save if it's a significant change (> 5s) or forced (pause/exit)
    if (!force && Math.abs(time - lastSavedTimeRef.current) < 5) return;

    const video = videoRef.current;
    const durationSeconds = video?.duration || 0;
    const isCompleted = durationSeconds > 0 && time / durationSeconds > 0.9;

    progressMutation.mutate({
      episodeId,
      progressSeconds: Math.floor(time),
      isCompleted
    });

    lastSavedTimeRef.current = time;
    // Local backup
    localStorage.setItem(`progress_${episodeId}`, String(Math.floor(time)));
  }, [episodeId, isLoggedIn, videoRef, progressMutation]);

  // COMBINED LOGIC: 15s View Count + 10s Interval Progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId) return;

    const interval = setInterval(() => {
      if (video.paused || video.ended) return;

      const currentTime = video.currentTime;

      // 1. View Count (after 20s)
      if (!hasFiredView.current && currentTime >= 20) {
        hasFiredView.current = true;
        watchService.recordView(episodeId).catch(() => { });
      }

      // 2. Periodic Progress Save (every 15s)
      if (isLoggedIn && document.visibilityState === "visible") {
        saveToBackend(currentTime);
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, [episodeId, isLoggedIn, saveToBackend]);

  // EVENT-DRIVEN SAVES: Pause, Seeked, BeforeUnload
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId || !isLoggedIn) return;

    const onPause = () => saveToBackend(video.currentTime, true);

    const onSeeked = () => {
      // Debounce seek events
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = setTimeout(() => {
        saveToBackend(video.currentTime, true);
      }, 1000);
    };

    const onBeforeUnload = () => saveToBackend(video.currentTime, true);

    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    };
  }, [episodeId, isLoggedIn, saveToBackend]);

  // Restore from local backup on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !episodeId) return;

    const savedProgress = localStorage.getItem(`progress_${episodeId}`);
    if (savedProgress) {
      const time = parseFloat(savedProgress);
      // Wait for metadata to ensure duration is available if needed, 
      // but simple currentTime set is often okay.
      const handleLoaded = () => {
        if (video.currentTime < time) {
          video.currentTime = time;
        }
      };
      video.addEventListener("loadedmetadata", handleLoaded, { once: true });
      return () => video.removeEventListener("loadedmetadata", handleLoaded);
    }
  }, [episodeId, videoRef]);
}
