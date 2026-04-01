import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { subscriptionService } from "@/services/subscriptionService";
import type { PaymentGateway, SubscriptionPlanDto, UserSubscriptionDto } from "@/types";

export function useVipCheckout(plan: SubscriptionPlanDto | null, mySub: UserSubscriptionDto | null) {
  const [gateway, setGateway] = useState<PaymentGateway>("VNPAY");

  const mutation = useMutation({
    mutationFn: () => {
      if (!plan) throw new Error("No plan selected");

      const isUpgrade = 
        (mySub?.status === "ACTIVE" || mySub?.status === "CANCELLED") && 
        mySub.planName !== plan.name;

      const payload = { planId: plan.id, gateway };

      if (isUpgrade) {
        return subscriptionService.upgradeSubscription(payload);
      }
      return subscriptionService.initiatePayment(payload);
    },
    onSuccess: ({ paymentUrl }) => {
      window.location.href = paymentUrl;
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Không thể khởi tạo thanh toán. Vui lòng thử lại.";
      toast.error(msg);
    },
  });

  return { gateway, setGateway, initiate: mutation.mutate, isPending: mutation.isPending };
}
