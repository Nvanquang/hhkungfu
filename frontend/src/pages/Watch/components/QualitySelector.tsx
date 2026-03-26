import { useState } from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoQuality } from "@/types/video.types";

interface QualitySelectorProps {
  qualities: VideoQuality[];
  currentQuality: string;
  onSelect: (quality: string, levelIndex: number) => void;
}

export function QualitySelector({ qualities, currentQuality, onSelect }: QualitySelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-white/80 hover:text-white transition-colors px-1 py-0.5 rounded"
        title="Chất lượng"
      >
        <Settings className="w-4 h-4" />
        <span className="text-xs hidden sm:inline">{currentQuality}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute bottom-full right-0 mb-2 z-50 min-w-[140px] bg-black/90 border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Chất lượng</p>
            </div>
            <div className="p-1">
              {/* Auto option */}
              <button
                onClick={() => { onSelect("auto", -1); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                  currentQuality === "auto" ? "text-primary bg-primary/10" : "text-white/70 hover:bg-white/10"
                )}
              >
                {currentQuality === "auto" && <span className="text-primary mr-2">●</span>}
                Tự động
              </button>

              {/* Specific quality levels */}
              {[...qualities].reverse().map((q, i) => {
                const levelIndex = qualities.length - 1 - i;
                const isActive = currentQuality === q.quality;
                return (
                  <button
                    key={q.quality}
                    onClick={() => { onSelect(q.quality, levelIndex); setOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                      isActive ? "text-primary bg-primary/10" : "text-white/70 hover:bg-white/10"
                    )}
                  >
                    {isActive ? <span className="text-primary mr-2">●</span> : <span className="mr-2 text-transparent">○</span>}
                    {q.quality}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
