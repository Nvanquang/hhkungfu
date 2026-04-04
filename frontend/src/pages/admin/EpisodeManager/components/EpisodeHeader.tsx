import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import type { AnimeSummary } from "@/types/anime.types";

interface Props {
  anime: AnimeSummary | null;
  animeId: number;
  episodeCount: number;
  onAddNew: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  ONGOING:   "Đang chiếu",
  COMPLETED: "Hoàn thành",
  UPCOMING:  "Sắp ra mắt",
};

export function EpisodeHeader({ anime, animeId, episodeCount, onAddNew }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/admin/animes" className="hover:text-slate-800 hover:underline">
          Danh sách Anime
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-[180px]">
          {anime?.title ?? `Anime #${animeId}`}
        </span>
        <span>/</span>
        <span>Quản lý tập</span>
      </nav>

      <div className="flex flex-wrap items-center gap-4">
        {/* Thumbnail */}
        {anime?.thumbnailUrl && (
          <img
            src={anime.thumbnailUrl}
            alt={anime.title ?? "thumbnail"}
            className="h-12 w-9 shrink-0 rounded-md object-cover shadow-sm"
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-slate-900 truncate">
            {anime?.title ?? `Anime #${animeId}`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            <span>{anime?.type ?? "—"}</span>
            <span className="mx-1">·</span>
            <span>{anime ? STATUS_LABEL[anime.status] : "—"}</span>
            <span className="mx-1">·</span>
            <span>{episodeCount} tập</span>
            {anime?.year && (
              <>
                <span className="mx-1">·</span>
                <span>{anime.year}</span>
              </>
            )}
          </p>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          Thêm tập
        </button>
      </div>
    </section>
  );
}
