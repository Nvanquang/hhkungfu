import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui";
import { adminService } from "@/services/adminService";
import { LightPanel, AdminPageHeader } from "@/pages/admin/shared/components";
import { UserFilters } from "./components/UserFilters";
import { UserTable } from "./components/UserTable";
import { toast } from "sonner";

export default function UserListPage() {
  const [key, setKey] = useState("");
  const [debouncedKey, setDebouncedKey] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | "active" | "inactive">("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKey(key), 400);
    return () => clearTimeout(timer);
  }, [key]);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", page, debouncedKey, status],
    queryFn: () =>
      adminService.listUsers({
        page,
        limit: 20,
        search: debouncedKey || undefined,
        isActive: status === "" ? undefined : status === "active",
      }),
  });

  const rows = useMemo(() => {
    return usersQuery.data?.items ?? [];
  }, [usersQuery.data]);

  const pagination = usersQuery.data?.pagination;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.updateUserStatus(id, isActive),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <AdminPageHeader
        title="Quản lý người dùng"
        description="Kiểm soát và phân quyền thành viên hệ thống"
        rightElement={
          <div className="text-right hidden sm:block bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng thành viên</p>
            <p className="text-lg font-bold text-slate-900 leading-none">{pagination?.total ?? rows.length} người</p>
          </div>
        }
      />

      <UserFilters
        searchKey={key}
        setSearchKey={(v) => { setPage(1); setKey(v); }}
        status={status}
        setStatus={(v) => { setPage(1); setStatus(v); }}
      />

      <LightPanel className="overflow-x-auto p-6">
        {usersQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-9 w-9 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu người dùng...</p>
          </div>
        ) : (
          <>
            <UserTable
              users={rows}
              onToggleStatus={(u) => updateStatusMutation.mutate({ id: u.id, isActive: !u.active })}
              isUpdating={updateStatusMutation.isPending}
            />

            {rows.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-lg font-bold text-slate-800 tracking-tight">Không tìm thấy kết quả</p>
                <p className="text-sm text-slate-400 mt-1 font-medium">Vui lòng thử điều chỉnh lại từ khóa hoặc bộ lọc.</p>
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
