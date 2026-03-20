import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/components/features/Breadcrumb";
import { useCatalogParams } from "./hooks/useCatalogParams";
import { useCatalogData } from "./hooks/useCatalogData";
import { useFilterChips } from "./hooks/useFilterChips";
import { DesktopFilterBar } from "./components/DesktopFilterBar";
import { MobileControls } from "./components/MobileControls";
import { AnimeGrid } from "./components/AnimeGrid";
import { CatalogPagination } from "./components/CatalogPagination";
import { FilterDialog } from "./components/FilterDialog";
import { SortDialog } from "./components/SortDialog";

export default function AnimeCatalog() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const { params, hasActiveFilters, setParam, setPage, clearFilters } = useCatalogParams();
  const { genres, items, pagination, isLoading, isError, isFetching, refetch } = useCatalogData(params);
  const activeFilterChips = useFilterChips(params, genres);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [params]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => now - i);
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <Breadcrumb items={[{ label: "Khám phá Anime" }]} />

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Khám phá Anime</h1>
        <p className="text-sm text-muted-foreground">
          {pagination ? `Tìm thấy ${pagination.total} anime` : "Đang tải..."}
          {isFetching && !isLoading ? " · Đang cập nhật..." : null}
        </p>
      </div>

      <DesktopFilterBar
        params={params}
        genres={genres}
        years={years}
        hasActiveFilters={hasActiveFilters}
        setParam={setParam}
        clearFilters={clearFilters}
      />

      <MobileControls
        activeFilterChips={activeFilterChips}
        onOpenFilter={() => setIsFilterOpen(true)}
        onOpenSort={() => setIsSortOpen(true)}
        setParam={setParam}
      />

      <AnimeGrid
        items={items}
        isLoading={isLoading}
        isError={isError}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        refetch={refetch}
      />

      <CatalogPagination pagination={pagination} setPage={setPage} />

      <FilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        params={params}
        genres={genres}
        years={years}
        setParam={setParam}
        clearFilters={clearFilters}
      />

      <SortDialog
        open={isSortOpen}
        onOpenChange={setIsSortOpen}
        params={params}
        setParam={setParam}
      />

      <div className="hidden">
        <Link to="/anime" />
      </div>
    </div>
  );
}