import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import type { PaymentResultDto } from "@/types";

function formatPrice(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function formatDate(iso: string | null) {
  if (!iso) return "N/A";
  return format(new Date(iso), "dd/MM/yyyy HH:mm");
}

/* -------------------------------------------------------------------------- */
/*                                 SUCCESS STATE                               */
/* -------------------------------------------------------------------------- */
export function ResultSuccess({ result }: { result: PaymentResultDto }) {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-emerald-500/30 bg-card p-8 text-center shadow-lg shadow-emerald-500/10">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">Thanh toán thành công!</h1>
      <p className="mb-8 text-muted-foreground">Chào mừng bạn đến với VIP ✨</p>

      <div className="mb-8 space-y-3 rounded-xl border border-border/40 bg-muted/20 p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mã đơn hàng</span>
          <span className="font-mono text-foreground">{result.orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gói VIP</span>
          <span className="font-semibold text-foreground">{result.planName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Số tiền</span>
          <span className="font-semibold text-emerald-500">{result.amount !== undefined ? formatPrice(result.amount) : "Đang cập nhật..."}</span>
        </div>
        <div className="my-2 border-t border-border/30" />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ngày mua</span>
          <span className="text-foreground">{result.paidAt ? formatDate(result.paidAt) : "Đang cập nhật..."}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hiệu lực đến</span>
          <span className="font-semibold text-amber-500">
            {result.expiresAt ? format(new Date(result.expiresAt), "dd/MM/yyyy") : "Đang cập nhật..."}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          to="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-black transition-colors hover:bg-amber-400"
        >
          🎬 Bắt đầu xem ngay
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/me/payments"
          className="flex w-full items-center justify-center rounded-xl border border-border bg-transparent py-3.5 font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Xem lịch sử thanh toán
        </Link>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/*                                 FAILED STATE                                */
/* -------------------------------------------------------------------------- */
export function ResultFailed({ orderCode, isTimeout = false }: { orderCode: string; isTimeout?: boolean }) {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-lg shadow-destructive/10">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-foreground">
        {isTimeout ? "Quá thời gian chờ" : "Thanh toán thất bại"}
      </h1>
      <p className="mb-8 text-muted-foreground">
        {isTimeout
          ? "Hệ thống chưa nhận được xác nhận thanh toán."
          : "Giao dịch không được hoàn thành hoặc đã bị hủy."}
      </p>

      <div className="mb-8 space-y-3 rounded-xl border border-border/40 bg-muted/20 p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mã đơn</span>
          <span className="font-mono text-foreground">{orderCode}</span>
        </div>
      </div>

      <p className="mb-8 text-sm font-medium text-destructive">Bạn chưa bị trừ tiền.</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/vip"
          className="flex flex-1 items-center justify-center rounded-xl bg-amber-500 py-3.5 font-bold text-black transition-colors hover:bg-amber-400"
        >
          Thử lại / Đổi gói
        </Link>
        <Link
          to="/"
          className="flex flex-1 items-center justify-center rounded-xl border border-border bg-transparent py-3.5 font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/*                                PENDING STATE                                */
/* -------------------------------------------------------------------------- */
export function ResultPending({ orderCode }: { orderCode: string }) {
  return (
    <div className="mx-auto mt-32 max-w-md text-center">
      <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-amber-500" />
      <h1 className="mb-2 text-xl font-bold text-foreground">Đang xác nhận giao dịch...</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Vui lòng không đóng trang này. Thường mất khoảng 10-30 giây.
      </p>
      <div className="mx-auto inline-flex rounded-full bg-muted/50 px-4 py-1.5 text-xs font-mono text-muted-foreground">
        Mã đơn: {orderCode}
      </div>
    </div>
  );
}
