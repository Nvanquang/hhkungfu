import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LightPanel } from "./LightPanel";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  rightElement?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  className,
  rightElement,
}: AdminPageHeaderProps) {
  return (
    <LightPanel className={cn("flex flex-wrap items-center justify-between gap-3 py-4 px-4", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="flex items-center justify-center p-2 rounded-xl bg-blue-600 shadow-md shadow-blue-200 text-white shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm font-medium text-slate-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {rightElement && (
        <div className="flex items-center gap-4">
          {rightElement}
        </div>
      )}
    </LightPanel>
  );
}
