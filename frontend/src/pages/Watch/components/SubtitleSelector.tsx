import { useState } from "react";
import { Captions } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VideoSubtitle } from "@/types/video.types";

interface SubtitleSelectorProps {
  subtitles: VideoSubtitle[];
  activeLanguage: string; // 'vi' | 'en' | 'none'
  onSelect: (trackIndex: number, language: string) => void;
}

export function SubtitleSelector({ subtitles, activeLanguage, onSelect }: SubtitleSelectorProps) {
  const [open, setOpen] = useState(false);

  const options = [
    ...subtitles.map((s, i) => ({ label: s.label, language: s.language, trackIndex: i })),
    { label: "Tắt", language: "none", trackIndex: -1 },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 transition-colors px-1 py-0.5 rounded",
          activeLanguage !== "none" ? "text-white" : "text-white/50 hover:text-white/80"
        )}
        title="Phụ đề"
      >
        <Captions className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-50 min-w-[140px] bg-black/90 border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Phụ đề</p>
            </div>
            <div className="p-1">
              {options.map((opt) => {
                const isActive = activeLanguage === opt.language;
                return (
                  <button
                    key={opt.language}
                    onClick={() => { onSelect(opt.trackIndex, opt.language); setOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors",
                      isActive ? "text-primary bg-primary/10" : "text-white/70 hover:bg-white/10"
                    )}
                  >
                    {isActive ? <span className="text-primary mr-2">●</span> : <span className="mr-2 text-transparent">○</span>}
                    {opt.label}
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
