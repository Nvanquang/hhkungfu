import { LightPanel } from "@/pages/admin/shared/components";
import { CheckCircle2, XCircle, Clock, LayoutGrid } from "lucide-react";

interface PipelineStatusProps {
  totalJobs: number;
  successJobs: number;
  failedJobs: number;
  activeJobs: number;
  successRate: number;
}

export function PipelineStatus({
  totalJobs,
  successJobs,
  failedJobs,
  activeJobs,
  successRate,
}: PipelineStatusProps) {
  return (
    <LightPanel className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">Trạng thái Video Pipeline</h3>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatusBox
          icon={<LayoutGrid className="h-4 w-4 text-blue-600" />}
          label="Tổng jobs"
          value={totalJobs}
          color="blue"
        />
        <StatusBox
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label="Thành công"
          value={successJobs}
          subLabel={`${successRate}%`}
          color="emerald"
        />
        <StatusBox
          icon={<XCircle className="h-4 w-4 text-rose-600" />}
          label="Thất bại"
          value={failedJobs}
          subLabel={`${totalJobs > 0 ? ((failedJobs / totalJobs) * 100).toFixed(1) : 0}%`}
          color="rose"
        />
        <StatusBox
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          label="Đang chạy"
          value={activeJobs}
          color="amber"
          pulse={activeJobs > 0}
        />
      </div>
    </LightPanel>
  );
}

function StatusBox({
  icon,
  label,
  value,
  subLabel,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subLabel?: string;
  color: "blue" | "emerald" | "rose" | "amber";
  pulse?: boolean;
}) {
  const bgColors = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className={`p-4 rounded-xl border border-slate-100 ${bgColors[color]} relative group hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-1.5 rounded-lg bg-white/60 group-hover:scale-110 transition-transform ${pulse ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
        {subLabel && <span className="text-[10px] font-bold opacity-70">{subLabel}</span>}
      </div>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value.toLocaleString()}</p>
      {pulse && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
    </div>
  );
}
