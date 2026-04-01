import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import type { PendingPaymentDto, PaymentGateway } from "@/types/subscription.types";

interface Props {
  pendingPayment: PendingPaymentDto;
  onContinue: (planId: number, gateway: PaymentGateway) => void;
  onCancel: () => void;
  isContinuing: boolean;
  isCanceling: boolean;
}

export function PendingOrderModal({
  pendingPayment,
  onContinue,
  onCancel,
  isContinuing,
  isCanceling,
}: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[425px] rounded-2xl bg-background p-6 shadow-xl ring-1 ring-border">
        
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10">
            <AlertCircle className="h-7 w-7 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Giao dịch đang chờ xử lý
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground leading-relaxed">
            Bạn có 1 giao dịch mua gói <strong className="text-foreground">{pendingPayment.planName}</strong> ({formatCurrency(pendingPayment.amount)}) qua cổng thanh toán <strong className="text-foreground">{pendingPayment.gateway}</strong> chưa hoàn tất.
          </p>
        </div>

        <div className="text-xs text-center text-muted-foreground mb-6 bg-muted/50 py-2 px-3 rounded-lg">
          Vui lòng hoàn tất hoặc hủy bỏ giao dịch này để tiếp tục.
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full h-11 text-base font-medium"
            onClick={() => onContinue(pendingPayment.planId, pendingPayment.gateway)}
            disabled={isContinuing || isCanceling}
          >
            {isContinuing && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Tiếp tục thanh toán
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 text-base font-medium"
            onClick={onCancel}
            disabled={isContinuing || isCanceling}
          >
            {isCanceling && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Hủy giao dịch & Chọn lại
          </Button>
        </div>

      </div>
    </div>
  );
}
