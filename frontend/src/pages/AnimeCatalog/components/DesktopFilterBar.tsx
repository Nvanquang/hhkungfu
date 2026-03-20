import type { AnimeQueryParams, Genre } from "@/types/anime.types";
import { STATUS_OPTIONS, TYPE_OPTIONS, SORT_OPTIONS, ORDER_OPTIONS, STATUS_LABEL, TYPE_LABEL, SORT_LABEL, ORDER_LABEL } from "../catalog.constants";

interface Props {
  params: AnimeQueryParams;
  genres: Genre[];
  years: number[];
  hasActiveFilters: boolean;
  setParam: (key: string, value: string | number | undefined | null) => void;
  clearFilters: () => void;
}

export function DesktopFilterBar({ params, genres, years, hasActiveFilters, setParam, clearFilters }: Props) {
  return (
    <div className="hidden lg:block rounded-xl border border-border/50 bg-card p-4">
      <div className="grid grid-cols-6 gap-3 items-end">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-muted-foreground">Thể loại</label>
          <select
            className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
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
          <label className="text-xs font-semibold text-muted-foreground">Trạng thái</label>
          <select
            className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={params.status ?? ""}
            onChange={(e) => setParam("status", e.target.value || undefined)}
          >
            <option value="">Tất cả</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Năm</label>
          <select
            className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={params.year ?? ""}
            onChange={(e) => setParam("year", e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Tất cả</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Loại</label>
          <select
            className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={params.type ?? ""}
            onChange={(e) => setParam("type", e.target.value || undefined)}
          >
            <option value="">Tất cả</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Sắp xếp</label>
          <div className="mt-1 flex gap-2">
            <select
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={params.sort ?? "viewCount"}
              onChange={(e) => setParam("sort", e.target.value)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s} value={s}>{SORT_LABEL[s]}</option>
              ))}
            </select>
            <select
              className="w-28 h-9 rounded-lg border border-input bg-background px-3 text-sm"
              value={params.order ?? "desc"}
              onChange={(e) => setParam("order", e.target.value)}
            >
              {ORDER_OPTIONS.map((o) => (
                <option key={o} value={o}>{ORDER_LABEL[o]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-span-6 flex justify-end">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Xóa bộ lọc
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}