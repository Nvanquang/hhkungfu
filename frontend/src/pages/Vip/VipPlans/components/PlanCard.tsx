import { cn } from "@/lib/utils";
import { Check, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SubscriptionPlanDto } from "@/types";

function formatPrice(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function savingPercent(price: number, original: number) {
  return Math.round((1 - price / original) * 100);
}

  interface PlanCardProps {
    plan: SubscriptionPlanDto;
    isPopular?: boolean;
    isCurrentPlan?: boolean;
    isDowngrade?: boolean;
    canRenew?: boolean;
  }
  
  export function PlanCard({ plan, isPopular = false, isCurrentPlan = false, isDowngrade = false, canRenew = false }: PlanCardProps) {
    const navigate = useNavigate();
    const perMonth =
      plan.durationDays >= 30
        ? Math.round(plan.price / (plan.durationDays / 30))
        : null;
  
    const saving =
      plan.originalPrice && plan.originalPrice > plan.price
        ? savingPercent(plan.price, plan.originalPrice)
        : null;
  
    return (
      <div
        className={cn(
          "relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-1",
          isPopular
            ? "border-amber-500/70 shadow-amber-500/10 shadow-md scale-[1.02] bg-gradient-to-b from-card to-amber-950/10"
            : "border-border/50"
        )}
      >
        {/* Popular badge */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-black shadow">
              <Star className="h-3 w-3 fill-black" />
              PHỔ BIẾN NHẤT
            </span>
          </div>
        )}
  
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
          {plan.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
          )}
        </div>
  
        {/* Price */}
        <div className="mb-1">
          <span className="text-3xl font-extrabold text-foreground">
            {formatPrice(plan.price)}
          </span>
          {plan.durationDays > 30 && (
            <span className="ml-1 text-sm text-muted-foreground">total</span>
          )}
        </div>
        {perMonth && plan.durationDays > 30 && (
          <p className="mb-1 text-sm text-muted-foreground">
            {formatPrice(perMonth)}/tháng
          </p>
        )}
        {saving && (
          <span className="mb-3 inline-flex w-fit rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Tiết kiệm {saving}%
          </span>
        )}
  
        {/* Features */}
        <ul className="mb-6 flex-1 space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
  
        {/* CTA */}
        <button
          onClick={() => {
            if (!isDowngrade && (!isCurrentPlan || canRenew)) navigate(`/vip/checkout?planId=${plan.id}`);
          }}
          disabled={isDowngrade || (isCurrentPlan && !canRenew)}
          className={cn(
            "w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
            isPopular
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/25"
              : "border border-border bg-background",
            isDowngrade || (isCurrentPlan && !canRenew)
              ? "opacity-50 cursor-not-allowed grayscale" 
              : (isPopular ? "hover:bg-amber-400" : "hover:bg-accent hover:text-accent-foreground")
          )}
        >
          {isCurrentPlan ? (canRenew ? "Gia hạn gói này" : "Chưa đến hạn gia hạn") : (isDowngrade ? "Chỉ duyệt nâng cấp" : "Chọn gói")}
        </button>
      </div>
    );
  }
