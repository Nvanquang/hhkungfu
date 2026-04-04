import { Link } from "react-router-dom";
import { MoreVertical, Pencil, Upload, RefreshCw, Clock, Trash2, Loader2 } from "lucide-react";
import {
  Skeleton,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui";
import type { EpisodeItem } from "@/types/episode.types";
import type { AnimeSummary } from "@/types/anime.types";
import { VIDEO_STATUS_LABEL, VIDEO_STATUS_COLOR, VIDEO_STATUS_DOT } from "../episode.constants";
import { formatDuration } from "@/utils/format";

// ── Spinning Loader khi PROCESSING ──────────────────────────────────────────
function ProcessingIndicator() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="relative flex h-4 w-4 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
      </div>
      <span className="text-[11px] font-bold text-blue-600">
        Đang xử lý
      </span>
    </div>
  );
}

// ── Dropdown [⋮] menu ────────────────────────────────────────────────────────
interface DropdownProps {
  episode: EpisodeItem;
  animeId: number;
  anime?: AnimeSummary | null;
  onHistory: (id: number) => void;
  onDelete: (id: number) => void;
}

function EpisodeDropdown({ episode, animeId, anime, onHistory, onDelete }: DropdownProps) {
  const canUpload = episode.videoStatus !== "READY" && episode.videoStatus !== "PROCESSING";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition outline-none"
        aria-label="Tùy chọn"
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 bg-white/95 backdrop-blur-md border-slate-200 shadow-xl p-1.5 pb-2">
        <DropdownMenuItem
          disabled
          title="Tính năng sưa tập phim đang được bảo trì (Chưa có API)"
          className="flex items-center px-2 py-2 text-slate-400 cursor-not-allowed opacity-60 rounded-md"
        >
          <Pencil className="mr-2.5 h-4 w-4" />
          <span className="font-medium">Sửa thông tin (Bảo trì)</span>
        </DropdownMenuItem>

        {canUpload && (
          <DropdownMenuItem className="p-0 hover:bg-black focus:bg-black rounded-md transition-all duration-200 group">
            <Link
              to={`/admin/upload/${episode.id}`}
              state={{ episode, anime, animeId }}
              className="flex w-full items-center px-2 py-2 text-slate-700 group-hover:text-white group-focus:text-white transition-colors"
            >
              <Upload className="mr-2.5 h-4 w-4 text-slate-500 group-hover:text-white group-focus:text-white transition-colors" />
              <span className="font-medium">Upload video</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          disabled
          title="Tính năng Transcode lại đang được bảo trì (Chưa có API)"
          className="flex items-center px-2 py-2 text-slate-400 cursor-not-allowed opacity-60 rounded-md"
        >
          <RefreshCw className="mr-2.5 h-4 w-4" />
          <span className="font-medium">Transcode lại (Bảo trì)</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onHistory(episode.id)}
          className="flex items-center px-2 py-2 text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 rounded-md transition-colors cursor-pointer"
        >
          <Clock className="mr-2.5 h-4 w-4 text-slate-500" />
          <span className="font-medium">Lịch sử encode</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(episode.id)}
          className="flex items-center px-2 py-2 text-red-600 focus:bg-red-50 focus:text-red-700 rounded-md transition-colors cursor-pointer"
        >
          <Trash2 className="mr-2.5 h-4 w-4" />
          <span className="font-semibold">Xóa tập</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



// ── Main table ────────────────────────────────────────────────────────────────
interface Props {
  episodes: EpisodeItem[];
  animeId: number;
  anime?: AnimeSummary | null;
  isLoading?: boolean;
  onHistory: (id: number) => void;
  onDelete: (id: number) => void;
}

export function EpisodeTable({ episodes, animeId, anime, isLoading, onHistory, onDelete }: Props) {
  if (isLoading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 w-16">Tập</th>
              <th className="px-4 py-3">Tên tập</th>
              <th className="px-4 py-3 w-24">Thời lượng</th>
              <th className="px-4 py-3 w-44">Video</th>
              <th className="px-4 py-3 w-16">Sub</th>
              <th className="px-4 py-3 w-12 text-right">⋮</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {episodes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  Chưa có tập phim nào. Nhấn <strong>+ Thêm tập</strong> để bắt đầu.
                </td>
              </tr>
            ) : (
              episodes.map((ep) => (
                <tr key={ep.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {String(ep.episodeNumber).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {ep.title ?? <span className="text-slate-400 italic">Chưa đặt tên</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {ep.durationSeconds
                      ? formatDuration(ep.durationSeconds)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {ep.videoStatus === "PROCESSING" ? (
                      <ProcessingIndicator />
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${VIDEO_STATUS_COLOR[ep.videoStatus]}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${VIDEO_STATUS_DOT[ep.videoStatus]}`} />
                        {VIDEO_STATUS_LABEL[ep.videoStatus]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {ep.hasVietsub && <span className="mr-1 font-medium text-slate-700">VI</span>}
                    {ep.hasEngsub && <span className="font-medium text-slate-700">EN</span>}
                    {!ep.hasVietsub && !ep.hasEngsub && <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <EpisodeDropdown
                      episode={ep}
                      animeId={animeId}
                      anime={anime}
                      onHistory={onHistory}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer count */}
        {episodes.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between text-xs text-slate-400 bg-slate-50">
            <span>Trang 1/1</span>
            <span>{episodes.length} tập</span>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden">
        {episodes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Chưa có tập phim nào.
          </p>
        ) : (
          episodes.map((ep) => (
            <div key={ep.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-slate-500">Tập {String(ep.episodeNumber).padStart(2, "0")}</span>
                  <p className="font-medium text-slate-900 text-sm">
                    {ep.title ?? <span className="italic text-slate-400">Chưa đặt tên</span>}
                  </p>
                  {ep.durationSeconds && (
                    <p className="text-xs text-slate-500">
                      {Math.floor(ep.durationSeconds / 60)}:{String(ep.durationSeconds % 60).padStart(2, "0")}
                    </p>
                  )}
                </div>
                <EpisodeDropdown
                  episode={ep}
                  animeId={animeId}
                  onHistory={onHistory}
                  onDelete={onDelete}
                />
              </div>

              {ep.videoStatus === "PROCESSING" ? (
                <ProcessingIndicator />
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${VIDEO_STATUS_COLOR[ep.videoStatus]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${VIDEO_STATUS_DOT[ep.videoStatus]}`} />
                    {VIDEO_STATUS_LABEL[ep.videoStatus]}
                  </span>
                  
                  {ep.videoStatus !== "READY" && (
                    <Link
                      to={`/admin/upload/${ep.id}`}
                      state={{ episode: ep, anime, animeId }}
                      className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Upload className="mr-1 h-3 w-3" />
                      Upload
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </section>
  );
}
