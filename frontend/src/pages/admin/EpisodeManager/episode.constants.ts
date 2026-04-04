import type { VideoStatus } from "@/types/episode.types";

// ── Video status display ─────────────────────────────────────────────────────

export const VIDEO_STATUS_LABEL: Record<VideoStatus, string> = {
  PENDING:    "Chờ upload",
  PROCESSING: "Đang xử lý",
  READY:      "Sẵn sàng",
  FAILED:     "Thất bại",
};

export const VIDEO_STATUS_COLOR: Record<VideoStatus, string> = {
  PENDING:    "bg-slate-100 text-slate-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  READY:      "bg-emerald-100 text-emerald-700",
  FAILED:     "bg-red-100 text-red-700",
};

export const VIDEO_STATUS_DOT: Record<VideoStatus, string> = {
  PENDING:    "bg-slate-400",
  PROCESSING: "bg-blue-500 animate-pulse",
  READY:      "bg-emerald-500",
  FAILED:     "bg-red-500",
};

// ── Subtitle language options ────────────────────────────────────────────────

export const SUBTITLE_LANG_OPTIONS = [
  { value: "vi", label: "Vietsub (VI)" },
  { value: "en", label: "Engsub (EN)" },
  { value: "ja", label: "Japanese (JA)" },
] as const;
