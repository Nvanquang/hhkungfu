import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerState {
  volume: number; // 0 to 1
  isMuted: boolean;
  currentQuality: string; // "360p", "720p", "auto"
  playbackRate: number; // 0.5, 1, 1.25, 1.5, 2
  isFullscreen: boolean;
  activeSubtitle: string; // 'vi', 'en', 'none'

  setVolume: (v: number) => void;
  toggleMute: () => void;
  setQuality: (q: string) => void;
  setPlaybackRate: (rate: number) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setActiveSubtitle: (language: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      volume: 1,
      isMuted: false,
      currentQuality: "auto",
      playbackRate: 1,
      isFullscreen: false,
      activeSubtitle: "vi",

      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () =>
        set((state) => ({
          isMuted: !state.isMuted,
          volume: state.isMuted && state.volume === 0 ? 1 : state.volume,
        })),
      setQuality: (currentQuality) => set({ currentQuality }),
      setPlaybackRate: (playbackRate) => set({ playbackRate }),
      setFullscreen: (isFullscreen) => set({ isFullscreen }),
      setActiveSubtitle: (activeSubtitle) => set({ activeSubtitle }),
    }),
    {
      name: "player-storage",
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        currentQuality: state.currentQuality,
        playbackRate: state.playbackRate,
        activeSubtitle: state.activeSubtitle,
      }),
    }
  )
);
