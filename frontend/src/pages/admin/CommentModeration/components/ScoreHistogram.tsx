import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  distribution: Record<number, number>;
  total: number;
  variant?: "spark" | "detailed";
}

export function ScoreHistogram({ distribution, total, variant = "spark" }: Props) {
  const max = useMemo(() => {
    const values = Object.values(distribution);
    return values.length > 0 ? Math.max(...values, 1) : 1;
  }, [distribution]);

  const scores = Array.from({ length: 10 }, (_, i) => i + 1).reverse(); // 10 down to 1

  if (variant === "spark") {
    // Small horizontal sparkline for table rows
    return (
      <div className="flex items-center gap-0.5 h-6 w-24">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
          const count = distribution[score] || 0;
          const height = total > 0 ? (count / max) * 100 : 0;
          return (
            <div 
              key={score} 
              className={cn(
                "flex-1 rounded-t-[1px] transition-all duration-500",
                score >= 8 ? "bg-green-500/60" : score <= 4 ? "bg-red-500/60" : "bg-blue-500/60"
              )} 
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          );
        })}
      </div>
    );
  }

  // Detailed horizontal bars with percentages
  return (
    <div className="space-y-2.5 w-full">
      {scores.map((score) => {
        const count = distribution[score] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const isHigh = score >= 8;
        const isLow = score <= 4;

        return (
          <div key={score} className="flex items-center gap-4 group">
            <div className="w-6 text-right text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">
              {score}
            </div>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  isHigh ? "bg-green-500" : isLow ? "bg-red-500" : "bg-blue-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-24 text-right">
              <span className="text-xs font-bold text-slate-700">{count.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">({percentage.toFixed(1)}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
