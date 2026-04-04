import { LightPanel } from "@/pages/admin/shared/components";
import { RefreshCcw, AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@/components/ui";

interface FailedJob {
  jobId: number;
  episodeId: number | null;
  error: string | null;
  at: string;
}

export function FailedJobsTable({
  jobs,
  onRetry,
}: {
  jobs: FailedJob[];
  onRetry: (id: number) => void;
}) {
  return (
    <LightPanel className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Jobs thất bại gần đây</h3>
        <span className="text-xs text-slate-400 font-medium">Top 5 jobs lỗi</span>
      </div>
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <table className="w-full text-xs sm:text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Job ID</th>
              <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Thời gian</th>
              <th className="pb-3 pr-4 font-semibold uppercase tracking-wider text-[10px]">Lỗi</th>
              <th className="pb-3 text-right font-semibold uppercase tracking-wider text-[10px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400 italic bg-slate-50/30 rounded-lg">
                  Không có job lỗi nào gần đây.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.jobId} className="group hover:bg-slate-50/80 transition-all duration-200">
                <td className="py-4 pr-4 font-mono font-bold text-slate-900 whitespace-nowrap lg:w-20">#{job.jobId}</td>
                <td className="py-4 pr-4 text-slate-600 whitespace-nowrap lg:w-40">
                  {new Date(job.at).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-4 pr-4 min-w-[180px] max-w-[300px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-2 text-rose-600 font-medium cursor-help group/err">
                        <div className="p-1 rounded-md bg-rose-50 shrink-0 group-hover/err:bg-rose-100 transition-colors">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate hover:underline underline-offset-2">
                          {job.error || "Lỗi không xác định"}
                        </span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 overflow-hidden border-none shadow-2xl z-[100]" side="top" align="start">
                      <div className="bg-slate-900 text-white p-3 text-[11px] leading-relaxed break-words">
                        <div className="font-bold text-rose-400 mb-2 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          CHI TIẾT LỖI HỆ THỐNG
                        </div>
                        <div className="font-mono bg-white/5 p-2 rounded-md border border-white/5">
                          {job.error || "Lỗi không xác định"}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-400 flex justify-between items-center">
                          <span>Job ID: #{job.jobId}</span>
                          <span>{new Date(job.at).toLocaleString()}</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {job.episodeId && (
                      <Link
                        to={`/admin/upload/${job.episodeId}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
                        title="Xem trang upload"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(job.jobId)}
                      className="h-8 group/btn relative overflow-hidden text-[11px] font-bold px-3 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all duration-300 rounded-lg"
                    >
                      <RefreshCcw className="h-3.5 w-3.5 mr-1.5 group-hover/btn:rotate-180 transition-transform duration-500" />
                      Thử lại
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LightPanel>
  );
}
