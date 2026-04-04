import { useQuery } from "@tanstack/react-query";
import { X, CheckCircle2, XCircle, Clock } from "lucide-react";
import { watchService } from "@/services/watchService";
import type { TranscodeJob } from "@/types/episode.types";
import type { EpisodeItem } from "@/types/episode.types";

interface Props {
  episode: EpisodeItem | null; // null = closed
  onClose: () => void;
}



function StatusIcon({ status }: { status: TranscodeJob["status"] }) {
  if (status === "DONE")   return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "FAILED") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
}

export function TranscodeHistoryModal({ episode, onClose }: Props) {
  const { data: jobs = [], isLoading } = useQuery<TranscodeJob[]>({
    queryKey: ["transcode-history", episode?.id],
    queryFn: () => watchService.getTranscodeHistory(episode!.id),
    enabled: !!episode,
    staleTime: 10_000,
  });

  if (!episode) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Lịch sử Transcode</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tập {String(episode.episodeNumber).padStart(2, "0")}
                {episode.title ? ` · ${episode.title}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            {isLoading ? (
              <p className="text-sm text-slate-400 text-center py-4">Đang tải…</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6 italic">
                Chưa có lịch sử transcode cho tập này.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-3">Job ID</th>
                      <th className="pb-2 pr-3">Bước xử lý</th>
                      <th className="pb-2 pr-3 text-center">Trạng thái</th>
                      <th className="pb-2 text-right">Tiến trình</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {[...jobs].map((job) => (
                        <tr key={job.jobId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-3 text-slate-500 font-mono text-xs">{job.jobId}</td>
                          <td className="py-3 pr-3 text-slate-600">
                             <span className="text-xs font-medium">{job.currentStep || "Initial"}</span>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5">
                                <StatusIcon status={job.status} />
                                <span
                                  className={`text-xs font-bold ${
                                    job.status === "DONE"
                                      ? "text-emerald-600"
                                      : job.status === "FAILED"
                                      ? "text-red-600"
                                      : "text-blue-600"
                                  }`}
                                >
                                  {job.status}
                                </span>
                              </span>
                              {job.status === "PROCESSING" && (
                                <div className="h-1 w-24 rounded-full bg-slate-100 overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-700 ease-in-out" 
                                    style={{ width: `${job.progress}%` }} 
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right font-medium text-slate-700 text-xs">
                            {job.progress}%
                          </td>
                        </tr>
                      ))}

                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-slate-200 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
