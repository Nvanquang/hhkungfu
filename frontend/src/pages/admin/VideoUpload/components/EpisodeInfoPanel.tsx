import { Link } from "react-router-dom";
import type { StreamInfo } from "@/types/video.types";
import type { EpisodeItem } from "@/types/episode.types";
import { QUALITY_OPTIONS, UPLOAD_NOTES } from "../video-upload.constants";
import type { QualityOption } from "../video-upload.constants";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ upload",
  PROCESSING: "Đang transcode",
  READY: "Sẵn sàng",
  FAILED: "Thất bại",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  READY: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

interface Props {
  episode: EpisodeItem | null;
  streamInfo: StreamInfo | undefined;
  animeId: number;
  title: string;
  selectedQualities: QualityOption[];
  onToggleQuality: (q: QualityOption) => void;
}

export function EpisodeInfoPanel({ episode, streamInfo, animeId, title, selectedQualities, onToggleQuality }: Props) {
  const status = streamInfo?.videoStatus ?? episode?.videoStatus ?? "PENDING";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      {/* Episode info */}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Thông tin tập</p>
        <p className="font-semibold text-slate-900 text-sm">
          Tập {episode ? String(episode.episodeNumber).padStart(2, "0") : "—"}
        </p>
        {episode?.title && (
          <p className="text-sm text-slate-600 mt-0.5">{episode.title}</p>
        )}
        <Link
          to={`/admin/animes/${animeId}/episodes`}
          className="text-xs text-blue-600 hover:underline mt-0.5 block"
        >
          {title} (Anime #{animeId})
        </Link>
        <span className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Quality selection */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Chọn chất lượng</p>
        <div className="space-y-1.5">
          {QUALITY_OPTIONS.map((q) => {
            const checked = selectedQualities.includes(q.value as QualityOption);
            return (
              <label
                key={q.value}
                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition ${checked
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-white text-slate-600"
                  } ${q.required ? "cursor-not-allowed opacity-80" : "hover:border-slate-300"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={q.required}
                  onChange={() => onToggleQuality(q.value as QualityOption)}
                  className="accent-blue-600 h-3.5 w-3.5"
                />
                <span className="font-medium">{q.label}</span>
                <span className="ml-auto text-xs text-slate-400">{q.description}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-3">
        <p className="text-xs font-semibold text-amber-800 mb-1.5">Lưu ý</p>
        <ul className="space-y-1">
          {UPLOAD_NOTES.map((note, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
              <span className="mt-0.5 shrink-0">•</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
