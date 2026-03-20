import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import type { AnimeQueryParams, Genre } from "@/types/anime.types";
import { STATUS_OPTIONS, TYPE_OPTIONS, STATUS_LABEL, TYPE_LABEL } from "../catalog.constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: AnimeQueryParams;
  genres: Genre[];
  years: number[];
  setParam: (key: string, value: string | number | undefined | null) => void;
  clearFilters: () => void;
}

export function FilterDialog({ open, onOpenChange, params, genres, years, setParam, clearFilters }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bộ lọc</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Thể loại</label>
            <select
              className="mt-2 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={params.genre ?? ""}
              onChange={(e) => setParam("genre", e.target.value || undefined)}
            >
              <option value="">Tất cả</option>
              {genres.map((g) => (
                <option key={g.id} value={g.slug as string}>
                  {g.nameVi || g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Trạng thái</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Button
                variant={params.status ? "outline" : "default"}
                className="w-full"
                onClick={() => setParam("status", undefined)}
              >
                Tất cả
              </Button>
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s}
                  variant={params.status === s ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setParam("status", s)}
                >
                  {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Loại</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Button
                variant={params.type ? "outline" : "default"}
                className="w-full"
                onClick={() => setParam("type", undefined)}
              >
                Tất cả
              </Button>
              {TYPE_OPTIONS.map((t) => (
                <Button
                  key={t}
                  variant={params.type === t ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setParam("type", t)}
                >
                  {TYPE_LABEL[t]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Năm phát hành</label>
            <select
              className="mt-2 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={params.year ?? ""}
              onChange={(e) => setParam("year", e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Tất cả</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              Xóa lọc
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Áp dụng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}