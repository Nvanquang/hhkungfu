import { LightPanel } from "@/pages/admin/shared/components";
import { CreditCard, Wallet } from "lucide-react";

interface PlanRevenue {
  planName: string;
  amount: number;
  orderCount: number;
}

interface GatewayRatio {
  gateway: string;
  amount: number;
  percentage: number;
}

export function SubscriptionSection({
  plans,
  gateways,
}: {
  plans: PlanRevenue[];
  gateways: GatewayRatio[];
}) {
  const maxPlanAmount = Math.max(...plans.map((p) => p.amount), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue by Plan */}
      <LightPanel className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Doanh thu theo gói</h3>
            <p className="text-xs text-slate-500">Thống kê 7 ngày qua</p>
          </div>
          <CreditCard className="h-5 w-5 text-blue-500" />
        </div>

        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.planName} className="space-y-1.5 focus-within:ring-2 ring-blue-100 rounded-lg transition-all p-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{plan.planName}</span>
                <span className="text-slate-900">{plan.amount.toLocaleString()}đ</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-1000 ease-out"
                  style={{ width: `${(plan.amount / maxPlanAmount) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{plan.orderCount} đơn hàng</div>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-4 italic">Chưa có dữ liệu giao dịch.</p>
          )}
        </div>
      </LightPanel>

      {/* Payment Gateways */}
      <LightPanel className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cổng thanh toán</h3>
            <p className="text-xs text-slate-500">Tỷ lệ giá trị giao dịch</p>
          </div>
          <Wallet className="h-5 w-5 text-emerald-500" />
        </div>

        <div className="space-y-6 pt-2">
          {gateways.length > 0 ? (
            <div className="space-y-5">
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                {gateways.map((g) => (
                  <div
                    key={g.gateway}
                    title={`${g.gateway}: ${g.percentage}%`}
                    className={`h-full transition-all duration-1000 ease-out ${
                      g.gateway.toLowerCase().includes("vnpay") 
                        ? "bg-blue-600" 
                        : g.gateway.toLowerCase().includes("momo") 
                          ? "bg-emerald-500" 
                          : "bg-slate-400"
                    }`}
                    style={{ width: `${g.percentage}%` }}
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {gateways.map((g) => (
                  <div key={g.gateway} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        g.gateway.toLowerCase().includes("vnpay") 
                          ? "bg-blue-600" 
                          : g.gateway.toLowerCase().includes("momo") 
                            ? "bg-emerald-500" 
                            : "bg-slate-400"
                      }`} />
                      <span className="text-xs font-bold text-slate-700">{g.gateway}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 ml-4">
                      {g.percentage}% ({g.amount.toLocaleString()}đ)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400 py-4 italic">Không có dữ liệu cổng thanh toán.</p>
          )}
        </div>
      </LightPanel>
    </div>
  );
}
