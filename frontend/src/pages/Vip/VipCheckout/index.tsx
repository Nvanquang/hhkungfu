import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useVipPlans, useMySubscription } from "@/pages/Vip/VipPlans/hooks/useVipPlans";
import { useVipCheckout } from "./hooks/useVipCheckout";
import { OrderSummaryCard } from "./components/OrderSummaryCard";
import { GatewaySelector } from "./components/GatewaySelector";

export default function VipCheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = Number(searchParams.get("planId"));

  const user = useAuthStore((state) => state.user);
  const isEmailVerified = !!user?.emailVerified;

  const { data: plans, isLoading: plansLoading } = useVipPlans();
  const { data: mySub } = useMySubscription();

  const plan = plans?.find((p) => p.id === planId) || null;
  const { gateway, setGateway, initiate, isPending } = useVipCheckout(plan, mySub || null);

  if (plansLoading) {
    return <div className="p-20 text-center text-muted-foreground">Đang tải gói...</div>;
  }

  if (!plan) {
    return (
      <div className="p-20 text-center text-muted-foreground">
        <p>Gói không tồn tại hoặc đã bị ẩn.</p>
        <button onClick={() => navigate("/vip")} className="mt-4 text-amber-500 hover:underline">
          Quay lại chọn gói khác
        </button>
      </div>
    );
  }

  const isVipActive = mySub?.status === "ACTIVE";
  const isCurrentPlan = isVipActive && plan.name === mySub?.planName;
  const remainingDays = mySub?.expiresAt 
    ? Math.max(0, Math.ceil((new Date(mySub.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) 
    : 0;
  const canRenew = isCurrentPlan && remainingDays <= 5;

  if (isCurrentPlan && !canRenew) {
    return (
      <div className="p-20 text-center text-muted-foreground">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h2 className="mb-2 text-xl font-bold text-foreground">Chưa đến hạn gia hạn</h2>
        <p>Gói hiện tại vẫn còn hạn trên 5 ngày. Vui lòng quay lại sau.</p>
        <button onClick={() => navigate("/vip")} className="mt-6 rounded-xl bg-amber-500 px-6 py-2.5 font-semibold text-black hover:bg-amber-400">
          Quay lại chọn gói khác
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:py-12">
      <button
        onClick={() => navigate("/vip")}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại chọn gói
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column: Flow Details */}
        <div className="lg:col-span-3 space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase mb-6">
              Thông tin thanh toán
            </h1>
            
            <section className="mb-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Đã chọn
              </h3>
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{plan.name}</p>
                    {plan.id === 2 && <span className="text-xs font-semibold text-amber-400">⭐ Phổ biến</span>}
                  </div>
                  <p className="mt-1 text-sm text-foreground/80">
                    {plan.price.toLocaleString("vi-VN")}đ
                  </p>
                </div>
                <button
                  onClick={() => navigate("/vip")}
                  className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
                >
                  [ Đổi gói ]
                </button>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Phương thức thanh toán
              </h3>
              <GatewaySelector value={gateway} onChange={setGateway} />
            </section>

            {!isEmailVerified && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 flex gap-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Email chưa xác thực</p>
                  <p className="opacity-90">Bạn cần xác thực email trước khi thanh toán để đảm bảo quyền lợi tài khoản.</p>
                  {/* Ideally link to profile/settings */}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-2">
          <OrderSummaryCard 
            plan={plan} 
            currentSub={mySub || null}
            onPay={() => initiate()}
            isPending={isPending}
            canPay={isEmailVerified}
          />
        </div>
      </div>
    </div>
  );
}
