import { LightPanel, AnimateNumber } from "@/pages/admin/shared/components";
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number;
  delta?: number | null;
  suffix?: string;
}

export function SummaryCard({ title, value, delta, suffix }: SummaryCardProps) {
  const isPositive = delta !== undefined && delta !== null && delta > 0;
  const isNegative = delta !== undefined && delta !== null && delta < 0;

  return (
    <LightPanel className="space-y-2">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900 flex items-baseline tracking-tight">
            <AnimateNumber value={value} />
            {suffix && <span className="ml-1 text-sm font-normal text-slate-500">{suffix}</span>}
          </div>
        </div>
        {delta !== undefined && delta !== null && (
          <div
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${isPositive
              ? "bg-emerald-50 text-emerald-600"
              : isNegative
                ? "bg-rose-50 text-rose-600"
                : "bg-slate-50 text-slate-600"
              }`}
          >
            {isPositive ? <TrendingUpIcon className="h-3 w-3" /> : isNegative ? <TrendingDownIcon className="h-3 w-3" /> : null}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
    </LightPanel>
  );
}
