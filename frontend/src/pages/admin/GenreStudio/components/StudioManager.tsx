import { useState } from "react";
import { Search, MoreVertical, Edit, Trash2, Plus } from "lucide-react";
import { Input, Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { Studio } from "@/types/anime.types";

interface StudioManagerProps {
  studios: Studio[];
  onEdit: (studio: Studio) => void;
  onDelete: (id: number) => void;
}

export function StudioManager({ studios, onEdit, onDelete }: StudioManagerProps) {
  const [search, setSearch] = useState("");

  const filtered = studios.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search & Stats Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm studio..."
            className="h-10 border-slate-200 bg-white pl-10 text-sm rounded-xl focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <span className="text-sm font-bold text-slate-400 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
            {studios.length} studio
          </span>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 font-semibold">
              <th className="px-6 py-4 border-b border-slate-100">Tên</th>
              <th className="px-6 py-4 border-b border-slate-100">Logo</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((studio) => (
              <tr key={studio.id} className="group hover:bg-blue-50/30 transition-all duration-200">
                <td className="px-6 py-4 font-bold text-slate-900">{studio.name}</td>
                <td className="px-6 py-4">
                  {studio.logoUrl ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-1 shadow-sm transition-transform group-hover:scale-110">
                      <img
                        src={studio.logoUrl}
                        alt={studio.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-300">
                      <Plus className="h-4 w-4" />
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50" />}>
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl border-slate-200 shadow-xl">
                      <DropdownMenuItem
                        onClick={() => onEdit(studio)}
                        className="rounded-lg py-2 cursor-pointer text-slate-700 focus:bg-blue-50 focus:text-blue-600"
                      >
                        <Edit className="mr-3 h-4 w-4" />
                        Sửa thông tin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg py-2 text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                        onClick={() => {
                          if (window.confirm("Bạn có chắc chắn muốn xóa studio này?")) {
                            onDelete(studio.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-3 h-4 w-4" />
                        Xóa studio
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
                    <p>Không tìm thấy studio nào phù hợp</p>
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
