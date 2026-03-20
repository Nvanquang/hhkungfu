import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { AnimeQueryParams } from "@/types/anime.types";
import { STATUS_OPTIONS, TYPE_OPTIONS, SORT_OPTIONS, ORDER_OPTIONS } from "../catalog.constants";

function getNumberParam(value: string | null) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function getEnumParam<T extends readonly string[]>(value: string | null, allowed: T): T[number] | undefined {
  if (!value) return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T[number]) : undefined;
}

export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = getNumberParam(searchParams.get("page")) ?? 1;
  const limit = getNumberParam(searchParams.get("limit")) ?? 12;

  const params = useMemo<AnimeQueryParams>(() => {
    const sort = getEnumParam(searchParams.get("sort"), SORT_OPTIONS);
    const order = getEnumParam(searchParams.get("order"), ORDER_OPTIONS);
    const status = getEnumParam(searchParams.get("status"), STATUS_OPTIONS);
    const type = getEnumParam(searchParams.get("type"), TYPE_OPTIONS);

    return {
      page,
      limit,
      sort,
      order,
      status,
      type,
      year: getNumberParam(searchParams.get("year")),
      season: undefined,
      genre: searchParams.get("genre"),
      studioId: getNumberParam(searchParams.get("studioId")),
    };
  }, [searchParams, page, limit]);

  const hasActiveFilters = Boolean(
    params.genre || params.status || params.type || params.year || params.sort || params.order
  );

  const setParam = (key: string, value: string | number | undefined | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === "" || Number.isNaN(value)) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    ["genre", "status", "type", "year", "sort", "order", "page"].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  return { params, hasActiveFilters, setParam, setPage, clearFilters };
}

//Đọc và ghi toàn bộ filter/sort/page lên URL search params, export params, setParam, setPage, clearFilters, hasActiveFilters.