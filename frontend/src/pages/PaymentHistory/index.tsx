import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscriptionService";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { CreditCard, History, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { PaymentStatus } from "@/types";
import { useEffect } from "react";

export default function PaymentHistoryPage() {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["paymentHistory", page],
    queryFn: () => subscriptionService.getPaymentHistory({ page, limit }),
  });

  const payments = pageData?.items || [];
  const totalPages = pageData?.pagination?.totalPages || 1;

  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return { label: "Thành công", color: "bg-green-500/10 text-green-500 hover:bg-green-500/20", icon: CheckCircle2 };
      case "FAILED":
        return { label: "Thất bại", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20", icon: XCircle };
      case "PENDING":
        return { label: "Chờ thanh toán", color: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20", icon: Clock };
      case "EXPIRED":
        return { label: "Hết hạn", color: "bg-muted text-muted-foreground", icon: AlertCircle };
      case "REFUNDED":
        return { label: "Đã hoàn tiền", color: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20", icon: AlertCircle };
      case "CANCELLED":
        return { label: "Đã hủy", color: "bg-red-500/10 text-red-500 hover:bg-red-500/20", icon: AlertCircle };
      default:
        return { label: status, color: "bg-muted text-muted-foreground", icon: AlertCircle };
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "--";
    return format(parseISO(dateString), "HH:mm - dd/MM/yyyy", { locale: vi });
  };

  return (
    <div className="main-container px-0 md:px-4 lg:px-8 py-0 md:py-8 space-y-6 md:space-y-8 pb-20 md:pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 md:hidden flex items-center gap-3 px-4 h-14 bg-background/80 backdrop-blur-md border-b">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h2 className="font-bold text-lg">Lịch sử giao dịch</h2>
      </div>

      <div className="px-4 md:px-0 max-w-4xl mx-auto">
        <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              Lịch sử giao dịch VIP
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Quản lý và xem lại các giao dịch gia hạn gói VIP của bạn.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/vip")} className="gap-2 rounded-xl">
            <CreditCard className="h-4 w-4" /> Xem các gói VIP
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-4 mt-6">
            {payments.map((payment) => {
              const statusConfig = getStatusConfig(payment.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div key={payment.orderId} className="bg-card border rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between gap-4 hover:border-primary/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${statusConfig.color.split(" ")[0]}`}>
                        <StatusIcon className={`h-5 w-5 ${statusConfig.color.split(" ")[1]}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base md:text-lg">Gói {payment.planName}</h3>
                        <p className="text-xs text-muted-foreground font-mono">Mã GD: {payment.orderId}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs">Thời gian tạo</p>
                        <p className="font-medium">{formatDate(payment.createdAt)}</p>
                      </div>
                      {payment.paidAt && (
                        <div>
                          <p className="text-muted-foreground mb-1 text-xs">Thời gian thanh toán</p>
                          <p className="font-medium text-foreground">{formatDate(payment.paidAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                    <div className="text-xl md:text-2xl font-black text-foreground mb-0 md:mb-2">
                      {formatMoney(payment.amount)}
                    </div>
                    <Badge variant="secondary" className={`font-bold uppercase text-[10px] tracking-wider px-2.5 py-1 ${statusConfig.color}`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20">
            <EmptyState
              icon={CreditCard}
              title="Chưa có giao dịch nào"
              description="Bạn chưa thực hiện bất kỳ giao dịch mua gói VIP nào."
              action={{
                label: "Nâng cấp VIP ngay",
                onClick: () => navigate("/vip")
              }}
            />
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Trang {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
