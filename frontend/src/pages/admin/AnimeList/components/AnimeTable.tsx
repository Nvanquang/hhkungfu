import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { AnimeStatusBadge } from "@/pages/admin/shared/components";
import type { AnimeSummary } from "@/types";

interface AnimeTableProps {
  items: AnimeSummary[];
  onToggleFeatured: (anime: AnimeSummary) => void;
  isFeaturedPending: boolean;
}

export function AnimeTable({ items, onToggleFeatured, isFeaturedPending }: AnimeTableProps) {
  return (
    <table className="w-full min-w-[900px] text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-slate-400 font-medium pb-2 uppercase text-[10px] tracking-widest">
          <th className="pb-3 pr-3 font-semibold">Thumbnail</th>
          <th className="pb-3 pr-3 font-semibold">Tên Anime</th>
          <th className="pb-3 pr-3 font-semibold">Loại</th>
          <th className="pb-3 pr-3 font-semibold">Trạng thái</th>
          <th className="pb-3 pr-3 font-semibold">Số tập</th>
          <th className="pb-3 text-right font-semibold">Thao tác</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-50">
        {items.map((anime: AnimeSummary) => (
          <tr key={anime.id} className="hover:bg-slate-50/50 transition">
            <td className="py-3 pr-3">
              <img
                src={anime.thumbnailUrl ?? ""}
                alt={anime.title ?? "Anime"}
                className="h-12 w-12 rounded-lg border border-slate-200 object-cover shadow-sm bg-slate-100"
              />
            </td>

            <td className="py-3 pr-3">
              <p className="font-semibold text-slate-800 leading-tight">
                {anime.title ?? "-"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                {anime.titleVi || "-"} <span className="mx-1 opacity-50">•</span> {anime.year || "N/A"}
              </p>
            </td>

            <td className="py-3 pr-3 text-slate-600 font-medium">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{anime.type}</span>
            </td>

            <td className="py-3 pr-3">
              <AnimeStatusBadge status={anime.status} />
            </td>

            <td className="py-3 pr-3 text-slate-700 font-medium font-mono text-xs">
              {anime.totalEpisodes ?? "?"}
            </td>

            <td className="py-3 text-right">
              <div className="inline-flex gap-2">
                <Link
                  to={`/admin/animes/${anime.id}/edit`}
                  state={{ anime }}
                  className="inline-flex h-8 min-w-[110px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  Sửa
                </Link>

                <Link
                  to={`/admin/animes/${anime.id}/episodes`}
                  className="inline-flex h-8 min-w-[110px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  Tập phim
                </Link>

                <Button
                  variant="outline"
                  className="inline-flex h-8 min-w-[110px] items-center justify-center border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                  disabled={isFeaturedPending}
                  onClick={() => onToggleFeatured(anime)}
                >
                  {anime.isFeatured ? "Bỏ nổi bật" : "Nổi bật"}
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
