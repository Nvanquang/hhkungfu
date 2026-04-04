import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { animeService } from "@/services/animeService";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import type { AnimeSummary, AnimeStatus, AnimeType } from "@/types/anime.types";
import { Button } from "@/components/ui";
import { LightPanel, AdminPageHeader, AnimateNumber } from "@/pages/admin/shared/components";
import { AnimeFilters } from "./components/AnimeFilters";
import { AnimeTable } from "./components/AnimeTable";

const PAGE_SIZE = 20;

export default function AnimeListPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<AnimeStatus | "">("");
  const [type, setType] = useState<AnimeType | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "animes", page, key, status, type],
    queryFn: () =>
      animeService.getAnimes({
        page,
        limit: PAGE_SIZE,
        key: key || undefined,
        status: status || undefined,
        type: type || undefined,
      }),
  });

  const items = data?.data.items ?? [];
  const pagination = data?.data.pagination;

  const featuredMutation = useMutation({
    mutationFn: ({
      id,
      isFeatured,
    }: {
      id: number;
      isFeatured: boolean;
    }) => adminService.updateAnimeFeatured(id, { isFeatured }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Đã cập nhật trạng thái nổi bật");
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "animes"],
      });
    },
  });

  const handleResetFilter = () => {
    setPage(1);
    setKey("");
    setStatus("");
    setType("");
  };

  const handleToggleFeatured = (anime: AnimeSummary) => {
    featuredMutation.mutate({
      id: anime.id,
      isFeatured: !anime.isFeatured,
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Quản lý Anime"
        description="Danh sách toàn bộ phim trên hệ thống"
        rightElement={
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng cộng</p>
              <p className="text-lg font-bold text-slate-900 leading-none"><AnimateNumber value={pagination?.total ?? 0} /> phim</p>
            </div>

            <Link
              to="/admin/animes/new"
              className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              + Thêm Anime mới
            </Link>
          </div>
        }
      />

      <AnimeFilters
        searchKey={key}
        setSearchKey={(v) => { setPage(1); setKey(v); }}
        status={status}
        setStatus={(v) => { setPage(1); setStatus(v); }}
        type={type}
        setType={(v) => { setPage(1); setType(v); }}
        onReset={handleResetFilter}
      />

      <LightPanel className="overflow-x-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400">Đang tải danh sách phim...</p>
          </div>
        ) : (
          <>
            <AnimeTable
              items={items}
              onToggleFeatured={handleToggleFeatured}
              isFeaturedPending={featuredMutation.isPending}
            />

            {items.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-lg font-semibold text-slate-800">Không tìm thấy anime nào</p>
                <p className="text-sm text-slate-400">Vui lòng thử điều chỉnh bộ lọc tìm kiếm.</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Trang {pagination?.page ?? 1} / {Math.max(1, pagination?.totalPages ?? 1)}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all px-4"
                  disabled={(pagination?.page ?? 1) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Trước
                </Button>

                <Button
                  variant="outline"
                  className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all px-4"
                  disabled={(pagination?.page ?? 1) >= (pagination?.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau →
                </Button>
              </div>
            </div>
          </>
        )}
      </LightPanel>
    </div>
  );
}
