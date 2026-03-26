import Hls, { type Level } from "hls.js";
import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/store/playerStore";

export interface HlsPlayerControls {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hlsRef: React.RefObject<Hls | null>;
  setHlsQuality: (levelIndex: number) => void;
  setSubtitleTrack: (trackIndex: number) => void;
  getHlsLevels: () => Level[];
}

export function useHlsPlayer(
  masterUrl: string | null | undefined,
  externalVideoRef?: React.RefObject<HTMLVideoElement | null>
): HlsPlayerControls {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const hlsRef = useRef<Hls | null>(null);
  const { currentQuality, volume, isMuted, playbackRate, setQuality } = usePlayerStore();

  // Destroy any existing HLS instance
  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!masterUrl || !videoRef.current) return;

    destroyHls();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,             // -1 = auto quality select
        capLevelToPlayerSize: true,  // don't load quality larger than player size
        maxBufferLength: 30,
      });

      hls.loadSource(masterUrl);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      // Restore persisted quality if not auto
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (currentQuality !== "auto") {
          const levelIndex = hls.levels.findIndex(
            (l) => `${l.height}p` === currentQuality
          );
          if (levelIndex >= 0) hls.currentLevel = levelIndex;
        }
      });

      return () => {
        destroyHls();
      };
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      videoRef.current.src = masterUrl;
    }
  }, [masterUrl, destroyHls]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume/mute/playbackRate on change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
    video.playbackRate = playbackRate;
  }, [volume, isMuted, playbackRate]);

  const setHlsQuality = useCallback((levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      const quality = levelIndex === -1
        ? "auto"
        : `${hlsRef.current.levels[levelIndex]?.height}p`;
      setQuality(quality);
    }
  }, [setQuality]);

  const setSubtitleTrack = useCallback((trackIndex: number) => {
    const video = videoRef.current;
    if (!video) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = i === trackIndex ? "showing" : "hidden";
    }
  }, []);

  const getHlsLevels = useCallback(() => {
    return hlsRef.current?.levels ?? [];
  }, []);

  return { videoRef, hlsRef, setHlsQuality, setSubtitleTrack, getHlsLevels };
}
