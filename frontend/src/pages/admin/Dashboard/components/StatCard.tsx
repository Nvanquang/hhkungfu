import type { ReactNode } from "react";
import { LightPanel, AnimateNumber } from "@/pages/admin/shared/components";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <LightPanel className="space-y-1">
      <div className="text-slate-400">{icon}</div>
      <AnimateNumber 
        value={value} 
        className="text-2xl font-bold text-slate-900 tracking-tight block" 
      />
      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</p>
    </LightPanel>
  );
}
