import { useMemo } from "react";
import type { AnimeQueryParams, Genre } from "@/types/anime.types";

export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export function useFilterChips(params: AnimeQueryParams, genres: Genre[]): FilterChip[] {
  return useMemo(() => {
    const chips: FilterChip[] = [];

    if (params.genre) {
      const g = genres.find((x) => x.slug === params.genre);
      chips.push({ key: "genre", label: g?.nameVi || g?.name || "Genre", value: String(params.genre) });
    }
    if (params.status) chips.push({ key: "status", label: params.status, value: params.status });
    if (params.type)   chips.push({ key: "type",   label: params.type,   value: params.type });
    if (params.year)   chips.push({ key: "year",   label: String(params.year), value: String(params.year) });

    return chips;
  }, [params.genre, params.status, params.type, params.year, genres]);
}

//Tính danh sách chip filter đang active (genre, status, type, year) để hiển thị trên mobile, dựa vào params và genres.