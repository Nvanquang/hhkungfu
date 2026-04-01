import { format } from "date-fns";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanDto, UserSubscriptionDto } from "@/types";

interface OrderSummaryCardProps {
  plan: SubscriptionPlanDto;
  currentSub: UserSubscriptionDto | null;
  onPay: () => void;
  isPending: boolean;
  canPay: boolean;
}

function formatPrice(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

export function OrderSummaryCard({ plan, currentSub, onPay, isPending, canPay }: OrderSummaryCardProps) {
  const isVip = currentSub?.status === "ACTIVE" && currentSub.expiresAt;

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-xl sticky top-24">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
        <CreditCard className="h-5 w-5 text-amber-500" />
        Đơn hàng
      </h2>

      {/* Item row */}
      <div className="flex items-center justify-between border-b border-border/30 pb-4 mb-4">
        <div>
          <p className="font-semibold text-foreground">{plan.name}</p>
          <p className="text-sm text-muted-foreground">{plan.durationDays} ngày VIP</p>
        </div>
        <p className="font-semibold text-foreground">{formatPrice(plan.price)}</p>
      </div>

      {/* Total row */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-medium text-muted-foreground">Tổng cộng</p>
        <p className="text-2xl font-extrabold text-amber-500">{formatPrice(plan.price)}</p>
      </div>

      {/* Renewal info */}
      {isVip && (
        <div className="mb-6 rounded-xl bg-amber-500/10 p-4 border border-amber-500/20">
          <p className="mb-2 text-sm font-medium text-amber-500">Gia hạn thêm vào gói hiện tại</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Hết hạn cũ: <span className="text-foreground">{format(new Date(currentSub.expiresAt!), "dd/MM/yyyy")}</span></p>
            <p className="flex items-center gap-1.5 text-amber-500">
              <CheckCircle2 className="h-4 w-4" />
              Gói mới sẽ nối tiếp gói cũ
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onPay}
        disabled={isPending || !canPay}
        className={cn(
          "w-full rounded-xl py-3.5 font-bold transition-all duration-200",
          !canPay 
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : isPending
              ? "bg-amber-500/70 text-black cursor-wait"
              : "bg-amber-500 text-black shadow-lg shadow-amber-500/25 hover:bg-amber-400 hover:-translate-y-0.5"
        )}
      >
        {isPending ? "Đang xử lý..." : "Thanh toán ngay"}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>🔒 Thanh toán bảo mật</span>
        <span>•</span>
        <span>SSL</span>
        <span>•</span>
        <span>PCI DSS</span>
      </div>
    </div>
  );
}
