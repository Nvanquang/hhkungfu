import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { LightPanel } from "@/pages/admin/shared/components";
import { CHART_COLORS } from "@/pages/admin/Analytics/analytics.constants";

interface ViewsData {
  date: string;
  views: number;
}

export function ViewsChart({ data }: { data: ViewsData[] }) {
  return (
    <LightPanel className="h-[400px] flex flex-col">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">Lượt xem theo ngày</h3>
      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(str) => {
                const parts = str.split("-");
                return parts.length > 2 ? `${parts[2]}/${parts[1]}` : str;
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}
              itemStyle={{ fontSize: "13px", padding: "0" }}
            />
            <Line
              type="monotone"
              dataKey="views"
              name="Lượt xem"
              stroke={CHART_COLORS.views}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </LightPanel>
  );
}
