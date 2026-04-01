import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "./components/PlanCard";
import { BenefitGrid } from "./components/BenefitGrid";
import { ComparisonTable } from "./components/ComparisonTable";
import { FaqAccordion } from "./components/FaqAccordion";
import { ActiveVipBanner } from "./components/ActiveVipBanner";
import { PendingOrderModal } from "./components/PendingOrderModal";
import { useVipPlans, useMySubscription, usePendingPayment, SUBSCRIPTION_KEYS } from "./hooks/useVipPlans";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscriptionService";
import { toast } from "sonner";
import type { PaymentGateway } from "@/types/subscription.types";

function PlansSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-72 rounded-2xl" />
      ))}
    </div>
  );
}

export default function VipPlansPage() {
  const { data: plans, isLoading: plansLoading } = useVipPlans();
  const { data: mySub } = useMySubscription();
  const { data: pendingPayment } = usePendingPayment();
  const queryClient = useQueryClient();

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  const continueMutation = useMutation({
    mutationFn: (args: { planId: number; gateway: PaymentGateway }) =>
      subscriptionService.initiatePayment(args),
    onSuccess: (data) => {
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi tạo lại thanh toán");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancelPendingPayment,
    onSuccess: () => {
      toast.success("Đã hủy giao dịch đang chờ");
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.pending() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Lỗi khi hủy giao dịch");
    },
  });

  const isVipActive = mySub?.status === "ACTIVE";
  const currentVipPrice = isVipActive && plans
    ? plans.find((p) => p.name === mySub?.planName)?.price || 0
    : 0;

  return (
    <div className="min-h-screen">
      {pendingPayment && (
        <PendingOrderModal
          pendingPayment={pendingPayment}
          isContinuing={continueMutation.isPending}
          isCanceling={cancelMutation.isPending}
          onContinue={(planId, gateway) => continueMutation.mutate({ planId, gateway })}
          onCancel={() => cancelMutation.mutate()}
        />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden py-16 text-center">
        {/* Subtle radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,_hsl(38_100%_50%_/_12%)_0%,_transparent_70%)]"
        />
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-amber-400" />
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Hhkungfu VIP
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Trải nghiệm anime không giới hạn
        </p>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 pb-20">
        {/* Active VIP banner */}
        {isVipActive && mySub && (
          <div>
            <ActiveVipBanner subscription={mySub} />
          </div>
        )}

        {/* Benefits */}
        <section>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Quyền lợi VIP
          </h2>
          <BenefitGrid />
        </section>

        {/* Plan cards */}
        <section id="plans">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {isVipActive ? "Gia hạn sớm" : "Chọn gói VIP"}
          </h2>
          {plansLoading ? (
            <PlansSkeleton />
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              {plans?.map((plan, i) => {
                const isCurrentPlan = isVipActive && plan.name === mySub?.planName;
                const isDowngrade = isVipActive && !isCurrentPlan && plan.price <= currentVipPrice;
                const remainingDays = mySub?.expiresAt 
                  ? Math.max(0, Math.ceil((new Date(mySub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) 
                  : 0;
                const canRenew = isCurrentPlan && remainingDays <= 5;
                
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    // Middle card (index 1) is "Phổ biến nhất"
                    isPopular={i === 1}
                    isCurrentPlan={isCurrentPlan}
                    isDowngrade={isDowngrade}
                    canRenew={canRenew}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Comparison table */}
        <section>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            So sánh gói
          </h2>
          <ComparisonTable />
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Câu hỏi thường gặp
          </h2>
          <FaqAccordion />
        </section>
      </div>
    </div>
  );
}
