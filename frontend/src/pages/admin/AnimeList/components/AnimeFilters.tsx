import { Button, Input } from "@/components/ui";
import { LightPanel } from "@/pages/admin/shared/components";
import type { AnimeStatus, AnimeType } from "@/types/anime.types";

interface AnimeFiltersProps {
  searchKey: string;
  setSearchKey: (v: string) => void;
  status: AnimeStatus | "";
  setStatus: (v: AnimeStatus | "") => void;
  type: AnimeType | "";
  setType: (v: AnimeType | "") => void;
  onReset: () => void;
}

export function AnimeFilters({
  searchKey,
  setSearchKey,
  status,
  setStatus,
  type,
  setType,
  onReset,
}: AnimeFiltersProps) {
  return (
    <LightPanel className="grid gap-3 md:grid-cols-4">
      <Input
        value={searchKey}
        onChange={(e) => setSearchKey(e.target.value)}
        placeholder="Tìm tên anime..."
        className="border-slate-300 bg-white text-slate-900"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as AnimeStatus | "")}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Trạng thái (Tất cả)</option>
        <option value="ONGOING">ONGOING</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="UPCOMING">UPCOMING</option>
      </select>

      <select
        value={type}
        onChange={(e) => setType(e.target.value as AnimeType | "")}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Loại hình (Tất cả)</option>
        <option value="TV">TV</option>
        <option value="MOVIE">MOVIE</option>
        <option value="OVA">OVA</option>
        <option value="ONA">ONA</option>
        <option value="SPECIAL">SPECIAL</option>
      </select>

      <Button
        type="button"
        variant="outline"
        className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        onClick={onReset}
      >
        Đặt lại bộ lọc
      </Button>
    </LightPanel>
  );
}
