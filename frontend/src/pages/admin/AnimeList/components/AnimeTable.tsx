import { useNavigate } from "react-router-dom";
import { 
  MoreHorizontal, 
  Pencil, 
  Image as ImageIcon, 
  Film, 
  Star, 
  Trash2 
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AnimeStatusBadge } from "@/pages/admin/shared/components";
import type { AnimeSummary } from "@/types";
import { cn } from "@/lib/utils";

interface AnimeTableProps {
  items: AnimeSummary[];
  onToggleFeatured: (anime: AnimeSummary) => void;
  onOpenImageUpload: (anime: AnimeSummary) => void;
  onDelete: (anime: AnimeSummary) => void;
  isFeaturedPending: boolean;
}

export function AnimeTable({ items, onToggleFeatured, onOpenImageUpload, onDelete, isFeaturedPending }: AnimeTableProps) {
  const navigate = useNavigate();

  return (
    <table className="w-full min-w-[1000px] text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-slate-400 font-medium pb-2 uppercase text-[10px] tracking-widest">
          <th className="pb-3 pr-3 font-semibold">Thumbnail</th>
          <th className="pb-3 pr-3 font-semibold">Tên Anime</th>
          <th className="pb-3 pr-3 font-semibold">Loại</th>
          <th className="pb-3 pr-3 font-semibold">Trạng thái</th>
          <th className="pb-3 pr-3 font-semibold text-center">Số tập</th>
          <th className="pb-3 text-right font-semibold">Thao tác</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-50">
        {items.map((anime: AnimeSummary) => (
          <tr key={anime.id} className="hover:bg-slate-50/50 transition duration-300">
            <td className="py-3 pr-3">
              <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                <img
                  src={anime.thumbnailUrl ?? "https://via.placeholder.com/150?text=No+Image"}
                  alt={anime.title ?? "Anime"}
                  className="h-full w-full object-cover"
                />
              </div>
            </td>

            <td className="py-3 pr-3">
              <p className="font-bold text-slate-900 leading-tight">
                {anime.title ?? "-"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">
                {anime.titleVi || "-"} <span className="mx-1 opacity-50">•</span> {anime.year || "N/A"}
              </p>
            </td>

            <td className="py-3 pr-3">
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest">{anime.type}</span>
            </td>

            <td className="py-3 pr-3">
              <AnimeStatusBadge status={anime.status} />
            </td>

            <td className="py-3 pr-3 text-slate-900 font-bold font-mono text-xs text-center">
              {anime.totalEpisodes ?? "?"}
            </td>

            <td className="py-3 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger 
                  render={
                    <Button 
                      variant="ghost" 
                      className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 transition-all active:scale-90"
                    >
                      <MoreHorizontal className="h-5 w-5 text-slate-500" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-52 p-1.5 shadow-2xl border-slate-100 rounded-xl">
                  <DropdownMenuItem 
                    className="rounded-lg h-9 text-xs font-bold text-slate-600 cursor-pointer"
                    onClick={() => navigate(`/admin/animes/${anime.id}/edit`, { state: { anime } })}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5 text-blue-500" />
                    Sửa thông tin
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    className="rounded-lg h-9 text-xs font-bold text-slate-600 cursor-pointer"
                    onClick={() => onOpenImageUpload(anime)}
                  >
                    <ImageIcon className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                    Quản lý ảnh
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    className="rounded-lg h-9 text-xs font-bold text-slate-600 cursor-pointer"
                    onClick={() => navigate(`/admin/animes/${anime.id}/episodes`)}
                  >
                    <Film className="mr-2 h-3.5 w-3.5 text-slate-500" />
                    Quản lý tập phim
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5 opacity-50" />

                  <DropdownMenuItem 
                    className="rounded-lg h-9 text-xs font-bold text-slate-600 cursor-pointer"
                    onClick={() => onToggleFeatured(anime)}
                    disabled={isFeaturedPending}
                  >
                    <Star className={cn("mr-2 h-3.5 w-3.5", anime.isFeatured ? "fill-amber-400 text-amber-400" : "text-slate-400")} />
                    {anime.isFeatured ? "Bỏ nổi bật" : "Đặt làm nổi bật"}
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    variant="destructive"
                    className="rounded-lg h-9 text-xs font-bold text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    onClick={() => onDelete(anime)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Xóa phim này
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
