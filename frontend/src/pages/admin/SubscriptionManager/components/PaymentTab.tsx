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
  Card
} from "@/components/ui";
import { Search, Filter, ArrowUpRight, TrendingUp, CheckCircle, Clock, ArrowDownRight } from "lucide-react";
import { useAdminPayments, useAdminSummary } from "../hooks/useAdminSubscriptions";
import { cn } from "@/lib/utils";
import { PaymentDetailModal } from "./PaymentDetailModal";

export function PaymentTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [gateway, setGateway] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: summary, isLoading: isSummaryLoading } = useAdminSummary();
  const { data: paymentsData, isLoading: isPaymentsLoading } = useAdminPayments({
    page,
    limit: 10,
    search: search.trim() || undefined,
    gateway: gateway !== "all" ? gateway : undefined,
    status: status !== "all" ? status : undefined,
  });

  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  if (isSummaryLoading && page === 1) return <PaymentLoadingSkeleton />;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            {summary && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                summary.revenueDelta > 0 && "text-emerald-600 bg-emerald-50",
                summary.revenueDelta < 0 && "text-rose-600 bg-rose-50",
                summary.revenueDelta === 0 && "text-slate-500 bg-slate-100"
              )}>
                {summary.revenueDelta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {summary.revenueDelta > 0 ? "+" : ""}{summary.revenueDelta}%
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">Doanh thu tháng này</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {summary ? `${summary.monthlyRevenue.toLocaleString()}đ` : "0đ"}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 italic">So với tháng trước</p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
            {summary && (
              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {summary.successRate}%
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500">Đơn thành công</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {summary ? `${summary.successOrderCount} / ${summary.totalOrderCount}` : "0 / 0"}
          </h3>
          <p className="text-[10px] text-slate-400 mt-2 italic">Total lifetime orders</p>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-white/20 text-white rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-white border-white/30 bg-white/10">Real-time</Badge>
            </div>
            <p className="text-sm font-medium text-white/80">Thanh toán đang chờ</p>
            <h3 className="text-2xl font-bold mt-1">Hệ thống ổn định</h3>
            <p className="text-[10px] text-white/60 mt-2">Đang liên kết với VNPAY & MoMo</p>
          </div>
          {/* Abstract background shape */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/20 rounded-full blur-xl" />
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80 lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Tìm email, mã đơn..."
            className="pl-9 h-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={gateway}
            onChange={(e) => setGateway(e.target.value)}
            className="h-10 min-w-[140px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
          >
            <option value="all">Tất cả Gateway</option>
            <option value="VNPAY">VNPAY</option>
            <option value="MOMO">MoMo</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="PAID">Thành công</option>
            <option value="PENDING">Đang chờ</option>
            <option value="FAILED">Thất bại</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>

          <Button variant="outline" className="h-10 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
            <Filter className="h-4 w-4 mr-2" />
            Lọc nâng cao
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold text-slate-600">Mã đơn & Ngày</TableHead>
              <TableHead className="font-bold text-slate-600">Người dùng</TableHead>
              <TableHead className="font-bold text-slate-600">Gói VIP</TableHead>
              <TableHead className="font-bold text-slate-600">Số tiền</TableHead>
              <TableHead className="font-bold text-slate-600">Gateway</TableHead>
              <TableHead className="font-bold text-slate-600">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPaymentsLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                </TableRow>
              ))
            ) : paymentsData?.items && paymentsData.items.length > 0 ? (
              paymentsData.items.map((payment) => (
                <TableRow
                  key={payment.orderId}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-slate-800 uppercase group-hover:text-blue-600 transition-colors">{payment.orderId}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{new Date(payment.createdAt).toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 line-clamp-1">{payment.user.username}</span>
                      <span className="text-xs text-slate-400 line-clamp-1">{payment.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold border-transparent whitespace-nowrap">
                      {payment.planName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-slate-900">{payment.amount.toLocaleString()}đ</span>
                  </TableCell>
                  <TableCell>
                    <GatewayBadge gateway={payment.gateway} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <EmptyState
                    title="Không tìm thấy thanh toán nào"
                    description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {paymentsData && paymentsData.pagination.totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between px-6 pb-6">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Trang {paymentsData.pagination.page} / {paymentsData.pagination.totalPages}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all px-4"
                disabled={paymentsData.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Trước
              </Button>
              <Button
                variant="outline"
                className="h-9 border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all px-4"
                disabled={paymentsData.pagination.page >= paymentsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau →
              </Button>
            </div>
          </div>
        )}
      </div>

      <PaymentDetailModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    PAID: { label: "PAID", className: "bg-green-100 text-green-700 border-green-200" },
    PENDING: { label: "PENDING", className: "bg-amber-50 text-amber-600 border-amber-200" },
    FAILED: { label: "FAILED", className: "bg-rose-50 text-rose-600 border-rose-200" },
    EXPIRED: { label: "EXPIRED", className: "bg-slate-100 text-slate-500 border-slate-200" },
    CANCELLED: { label: "CANCELLED", className: "bg-slate-50 text-slate-400 border-slate-200" },
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

function GatewayBadge({ gateway }: { gateway: string }) {
  if (gateway === "VNPAY") {
    return <Badge className="bg-blue-600 text-white border-transparent text-[10px] py-0">VNPay</Badge>;
  }
  if (gateway === "MOMO") {
    return <Badge className="bg-purple-600 text-white border-transparent text-[10px] py-0">MoMo</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] py-0">{gateway}</Badge>;
}

function PaymentLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
