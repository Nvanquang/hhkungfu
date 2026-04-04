import { useState } from "react";
import { 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  Badge, 
  Input,
  Skeleton,
  EmptyState,
  Progress
} from "@/components/ui";
import { Search, Filter, Mail, ExternalLink } from "lucide-react";
import { useAdminVipMembers, useAdminPlans } from "../hooks/useAdminSubscriptions";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function VipMemberTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planId, setPlanId] = useState("all");
  const [status, setStatus] = useState("all");

  const { plans } = useAdminPlans();
  const { data: vipsData, isLoading } = useAdminVipMembers({
    page,
    limit: 10,
    search: search.trim() || undefined,
    planId: planId !== "all" ? Number(planId) : undefined,
    status: status !== "all" ? status : undefined,
  });


  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80 lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Tìm email, username..." 
            className="pl-9 h-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select 
            value={planId} 
            onChange={(e) => setPlanId(e.target.value)}
            className="h-10 min-w-[140px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
          >
            <option value="all">Tất cả Gói</option>
            {(plans || []).map(p => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>

          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <Button variant="outline" className="h-10 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="h-4 w-4 mr-2" />
            Lọc
          </Button>
        </div>
      </div>

      {/* Stats Summary - Optional quick info */}
      <div className="px-1 flex justify-between items-end">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
          Tổng cộng: <span className="text-blue-600 font-bold">{vipsData?.pagination.total || 0}</span> VIP hiện tại
        </p>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold text-slate-600">Thành viên</TableHead>
              <TableHead className="font-bold text-slate-600">Gói VIP</TableHead>
              <TableHead className="font-bold text-slate-600">Thời hạn</TableHead>
              <TableHead className="font-bold text-slate-600">Tiến độ</TableHead>
              <TableHead className="font-bold text-slate-600 text-right">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell>
                </TableRow>
              ))
            ) : vipsData?.items && vipsData.items.length > 0 ? (
              vipsData.items.map((vip) => (
                <TableRow key={vip.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0">
                        {vip.user.avatarUrl ? (
                          <img src={vip.user.avatarUrl} alt={vip.user.username} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 ring-2 ring-white shadow-sm uppercase">
                            {vip.user.username.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <Link 
                          to={`/admin/users?search=${vip.user.email}`} 
                          className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1"
                        >
                          {vip.user.username}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {vip.user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold whitespace-nowrap bg-slate-50">
                      {vip.planName}
                    </Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-slate-700">
                        Hết hạn: <span className="font-bold">{vip.expiresAt ? new Date(vip.expiresAt).toLocaleDateString() : "—"}</span>
                      </div>
                      <span className={cn(
                        "text-xs font-bold mt-0.5",
                        vip.remainingDays > 7 ? "text-slate-400" : "text-rose-500"
                      )}>
                        {vip.remainingDays > 0 ? `còn ${vip.remainingDays} ngày` : `hết hạn ${Math.abs(vip.remainingDays)} ngày trước`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <div className="space-y-1.5">
                      <Progress 
                        value={vip.progress} 
                        className={cn(
                          "h-1.5 w-full",
                          vip.status === "ACTIVE" ? "[&>div]:bg-green-500" : 
                          vip.status === "CANCELLED" ? "[&>div]:bg-rose-400" : "[&>div]:bg-slate-300"
                        )} 
                      />
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Used {vip.progress}%</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge status={vip.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <EmptyState 
                    title="Không có thành viên VIP" 
                    description="Hiện chưa có người dùng nào đăng ký gói VIP với tiêu chí này."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {vipsData && vipsData.pagination.totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between px-6 pb-6">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Trang {vipsData.pagination.page} / {vipsData.pagination.totalPages}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all px-4"
                disabled={vipsData.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Trước
              </Button>
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all px-4"
                disabled={vipsData.pagination.page >= vipsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "ACTIVE", className: "bg-green-100 text-green-700 border-green-200" },
    EXPIRED: { label: "EXPIRED", className: "bg-slate-100 text-slate-500 border-slate-200" },
    CANCELLED: { label: "CANCELLED", className: "bg-rose-50 text-rose-600 border-rose-200" },
    PENDING: { label: "PENDING", className: "bg-amber-50 text-amber-600 border-amber-200" },
  };

  const config = configs[status] || configs.EXPIRED;

  return (
    <Badge 
      variant="outline" 
      className={cn("font-bold text-[10px] tracking-wider py-0.5", config.className)}
    >
      {config.label}
    </Badge>
  );
}
