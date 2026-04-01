import { useState } from "react";
import { differenceInDays, parseISO } from "date-fns";
import { Crown, History } from "lucide-react";
import { Link } from "react-router-dom";
import { subscriptionService } from "@/services/subscriptionService";
import type { UserSubscriptionDto } from "@/types";

interface ActiveVipBannerProps {
  subscription: UserSubscriptionDto;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ActiveVipBanner({ subscription }: ActiveVipBannerProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy gói VIP không? Bạn vẫn có thể sử dụng cho đến khi hết hạn.")) return;
    try {
      setIsCancelling(true);
      await subscriptionService.cancelSubscription();
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Hủy gói thất bại!");
    } finally {
      setIsCancelling(false);
    }
  };

  const daysLeft = subscription.expiresAt
    ? Math.max(0, differenceInDays(parseISO(subscription.expiresAt), new Date()))
    : 0;

  const totalDays = subscription.startedAt && subscription.expiresAt
    ? Math.max(1, differenceInDays(parseISO(subscription.expiresAt), parseISO(subscription.startedAt)))
    : 30; // fallback to 30 days if startedAt is missing

  const pct = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-card p-6 shadow-lg shadow-amber-500/5">
      <div className="flex items-center gap-3 mb-4">
        <Crown className="h-5 w-5 text-amber-400" />
        <p className="font-semibold text-foreground">Bạn đang là thành viên VIP</p>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground mb-4">
        <p>
          <span className="text-foreground font-medium">Gói hiện tại:</span>{" "}
          {subscription.planName}
        </p>
        {subscription.expiresAt && (
          <p>
            <span className="text-foreground font-medium">Hết hạn:</span>{" "}
            {formatDate(subscription.expiresAt)}{" "}
            <span className="text-amber-400 font-medium">(còn {daysLeft} ngày)</span>
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground text-right">{daysLeft} ngày còn lại</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="#plans"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Nâng cấp gói
        </a>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          {isCancelling ? "Đang xử lý..." : "Hủy gói"}
        </button>
        <Link
          to="/me/payments"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <History className="h-4 w-4" />
          Xem lịch sử thanh toán
        </Link>
      </div>
    </div>
  );
}
