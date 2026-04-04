import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { LightPanel } from "@/pages/admin/shared/components";
import { CHART_COLORS } from "@/pages/admin/Analytics/analytics.constants";
import { useMemo, useState } from "react";
import { TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyData {
  date: string;
  views?: number;
  amount?: number;
}

export function AnalyticsMainChart({ 
  viewsData, 
  revenueData 
}: { 
  viewsData: { date: string; views: number }[]; 
  revenueData: { date: string; amount: number }[];
}) {
  const [activeTab, setActiveTab] = useState<"views" | "revenue">("views");

  const mergedData = useMemo(() => {
    const map = new Map<string, DailyData>();
    
    viewsData.forEach(v => map.set(v.date, { ...map.get(v.date), date: v.date, views: v.views }));
    revenueData.forEach(r => map.set(r.date, { ...map.get(r.date), date: r.date, amount: r.amount }));
    
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [viewsData, revenueData]);

  return (
    <LightPanel className="h-[480px] flex flex-col p-6 overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("views")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
              activeTab === "views" 
                ? "bg-white text-blue-600 shadow-lg shadow-blue-100 scale-[1.02]" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Lượt xem
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
              activeTab === "revenue" 
                ? "bg-white text-emerald-600 shadow-lg shadow-emerald-100 scale-[1.02]" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <DollarSign className="h-4 w-4" />
            Doanh thu
          </button>
        </div>

        <div className="hidden sm:block text-right">
          <h3 className="text-sm font-black text-slate-800">
            {activeTab === "views" ? "Phân tích lượt truy cập" : "Phân tích tăng trưởng tài chính"}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Real-time Database Tracking
          </p>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.views} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={CHART_COLORS.views} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              tickFormatter={(str) => {
                const parts = str.split("-");
                if (parts.length < 3) return str;
                // Formats YYYY-MM-DD to DD/MM
                return `${parts[2]}/${parts[1]}`;
              }}
              minTickGap={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              tickFormatter={(val) => {
                if (activeTab === "revenue") {
                  return val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
                }
                return val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
              }}
            />
            <Tooltip
              cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                padding: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
              }}
              labelStyle={{ fontWeight: 800, color: "#0f172a", marginBottom: "8px", fontSize: "14px" }}
              itemStyle={{ fontSize: "12px", fontWeight: 700, padding: "0" }}
              formatter={(value: any) => [
                activeTab === "revenue" ? `${Number(value).toLocaleString()}đ` : Number(value).toLocaleString(),
                activeTab === "views" ? "Lượt xem" : "Doanh thu"
              ]}
            />
            {activeTab === "views" ? (
              <Area
                type="monotone"
                dataKey="views"
                stroke={CHART_COLORS.views}
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorViews)"
                animationDuration={1200}
                activeDot={{ r: 6, strokeWidth: 0, fill: CHART_COLORS.views }}
              />
            ) : (
              <Area
                type="monotone"
                dataKey="amount"
                stroke={CHART_COLORS.revenue}
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                animationDuration={1200}
                activeDot={{ r: 6, strokeWidth: 0, fill: CHART_COLORS.revenue }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </LightPanel>
  );
}

