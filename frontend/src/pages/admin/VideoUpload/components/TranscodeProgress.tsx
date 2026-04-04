import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Circle, AlertTriangle, RefreshCw, PlayCircle } from "lucide-react";
import type { UploadPhase } from "../hooks/useVideoUpload";
import type { StreamInfo } from "@/types/video.types";

const QUALITY_STEPS = ["360p", "720p", "1080p"] as const;

interface StepStatus {
  label: string;
  status: "done" | "running" | "waiting" | "failed";
  progress?: number;
}

function buildSteps(streamInfo: StreamInfo | undefined, phase: UploadPhase): StepStatus[] {
  if (!streamInfo || phase !== "transcoding") {
    // Generic display when no real data
    return QUALITY_STEPS.map((q, i) => ({
      label: q,
      status: i === 0 ? "running" : "waiting",
      progress: i === 0 ? 50 : undefined,
    }));
  }

  const readyQualities = streamInfo.qualities?.map((q) => q.quality);

  return QUALITY_STEPS.map((q) => ({
    label: q,
    status: readyQualities?.includes(q)
      ? "done"
      : streamInfo.videoStatus === "PROCESSING"
        ? "running"
        : "waiting",
    progress: streamInfo.videoStatus === "PROCESSING" && !readyQualities?.includes(q) ? 60 : undefined,
  }));
}

// ── Individual step row ──────────────────────────────────────────────────────
function StepRow({ step }: { step: StepStatus }) {
  return (
    <div className="flex items-center gap-3">
      {step.status === "done" && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      )}
      {step.status === "running" && (
        <Loader2 className="h-4 w-4 shrink-0 text-blue-500 animate-spin" />
      )}
      {step.status === "waiting" && (
        <Circle className="h-4 w-4 shrink-0 text-slate-300" />
      )}
      {step.status === "failed" && (
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={`text-sm font-medium ${step.status === "done"
                ? "text-emerald-700"
                : step.status === "running"
                  ? "text-blue-700"
                  : step.status === "failed"
                    ? "text-red-700"
                    : "text-slate-400"
              }`}
          >
            {step.label}
          </span>
          <span className="text-xs text-slate-400 ml-2">
            {step.status === "done" && "hoàn thành ✓"}
            {step.status === "running" && (step.progress !== undefined ? `${step.progress}%` : "đang chạy…")}
            {step.status === "waiting" && "chờ"}
            {step.status === "failed" && "thất bại"}
          </span>
        </div>
        {step.status === "running" && step.progress !== undefined && (
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${step.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
interface Props {
  phase: UploadPhase;
  streamInfo: StreamInfo | undefined;
  animeId: number;
  onRetry: () => void;
}

export function TranscodeProgress({ phase, streamInfo, animeId, onRetry }: Props) {
  // Only show when in transcoding phase or done/failed
  if (phase === "idle" || phase === "uploading") return null;

  const steps = buildSteps(streamInfo, phase);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <p className="text-sm font-semibold text-slate-800">Tiến trình Transcode</p>

      {/* Phase: transcoding */}
      {phase === "transcoding" && (
        <>
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang xử lý video…</span>
          </div>
          <div className="space-y-3 pl-1">
            {steps.map((s) => (
              <StepRow key={s.label} step={s} />
            ))}
          </div>
        </>
      )}

      {/* Phase: done */}
      {phase === "done" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Transcode hoàn thành!</span>
          </div>
          <p className="text-xs text-slate-500">Video đã sẵn sàng phát.</p>
          <div className="flex flex-wrap items-center gap-2">
            {streamInfo?.masterUrl && (
              <a
                href={streamInfo.masterUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-700 transition"
              >
                <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                Xem thử
              </a>
            )}
            <Link
              to={`/admin/animes/${animeId}/episodes`}
              className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 transition"
            >
              ← Về danh sách tập
            </Link>
          </div>
        </div>
      )}

      {/* Phase: failed */}
      {phase === "failed" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-semibold">Transcode thất bại</span>
          </div>
          <p className="text-xs text-slate-500">Đã xảy ra lỗi trong quá trình xử lý video.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-8 items-center rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 transition"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Thử lại
            </button>
            <Link
              to={`/admin/animes/${animeId}/episodes`}
              className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50 transition"
            >
              ← Về danh sách tập
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
