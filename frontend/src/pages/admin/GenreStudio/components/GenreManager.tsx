import { useState } from "react";
import { Search, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Input, Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { Genre } from "@/types/anime.types";

interface GenreManagerProps {
  genres: Genre[];
  onEdit: (genre: Genre) => void;
  onDelete: (id: number) => void;
}

export function GenreManager({ genres, onEdit, onDelete }: GenreManagerProps) {
  const [search, setSearch] = useState("");

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

  const filtered = genres.filter((g) => {
    const term = normalize(search);
    return (
      normalize(g.name || "").includes(term) ||
      normalize(g.nameVi || "").includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Stats Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm thể loại..."
            className="h-10 border-slate-200 bg-white pl-10 text-sm rounded-xl focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <span className="text-sm font-bold text-slate-400 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
            {genres.length} thể loại
          </span>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 font-semibold">
              <th className="px-6 py-4 border-b border-slate-100">Tên EN</th>
              <th className="px-6 py-4 border-b border-slate-100">Tên VI</th>
              <th className="px-6 py-4 border-b border-slate-100">Slug</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((genre) => (
              <tr key={genre.id} className="group hover:bg-blue-50/30 transition-all duration-200">
                <td className="px-6 py-4 font-bold text-slate-900">{genre.name}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{genre.nameVi || "-"}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono text-xs">
                    {genre.slug}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50" />}>
                        <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-slate-200 shadow-xl">
                      <DropdownMenuItem
                        onClick={() => onEdit(genre)}
                        className="rounded-lg py-2 cursor-pointer text-slate-700 focus:bg-blue-50 focus:text-blue-600"
                      >
                        <Edit className="mr-3 h-4 w-4" />
                        Sửa thông tin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg py-2 text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                        onClick={() => {
                          if (window.confirm("Bạn có chắc chắn muốn xóa thể loại này?")) {
                            onDelete(genre.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-3 h-4 w-4" />
                        Xóa thể loại
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Search className="h-8 w-8 opacity-20" />
                    <p>Không tìm thấy thể loại nào phù hợp</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
