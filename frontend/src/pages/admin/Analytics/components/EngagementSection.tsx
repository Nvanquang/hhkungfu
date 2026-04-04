import { MessageSquare, Star, TrendingUp } from "lucide-react";
import { LightPanel } from "@/pages/admin/shared/components";

interface TopEpisode {
  episodeId: number;
  episodeTitle: string;
  animeTitle: string;
  commentCount: number;
}

export function EngagementSection({
  comments,
  commentsDelta,
  ratings,
  ratingsDelta,
  topEpisodes,
}: {
  comments: number;
  commentsDelta: number;
  ratings: number;
  ratingsDelta: number;
  topEpisodes: TopEpisode[];
}) {
  const maxComments = Math.max(...topEpisodes.map((e) => e.commentCount), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Interaction Summary */}
      <div className="grid grid-cols-2 gap-4">
        <LightPanel className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">Bình luận mới</h4>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{comments.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-[11px]">
              <span className={commentsDelta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {commentsDelta >= 0 ? "▲" : "▼"} {Math.abs(commentsDelta).toFixed(1)}%
              </span>
              <span className="text-slate-400 font-medium whitespace-nowrap">so với kỳ trước</span>
            </div>
          </div>
        </LightPanel>

        <LightPanel className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
              <Star className="h-5 w-5 fill-yellow-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 tracking-tight">Đánh giá mới</h4>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">{ratings.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-[11px]">
              <span className={ratingsDelta >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {ratingsDelta >= 0 ? "▲" : "▼"} {Math.abs(ratingsDelta).toFixed(1)}%
              </span>
              <span className="text-slate-400 font-medium whitespace-nowrap">so với kỳ trước</span>
            </div>
          </div>
        </LightPanel>
      </div>

      {/* Top Commented Episodes */}
      <LightPanel className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Top tập phim thảo luận</h4>
            <p className="text-xs text-slate-500">Số lượng bình luận mới</p>
          </div>
          <TrendingUp className="h-5 w-5 text-indigo-500" />
        </div>

        <div className="space-y-3 pt-1">
          {topEpisodes.map((ep) => (
            <div key={ep.episodeId} className="space-y-1">
              <div className="flex justify-between items-end mb-1">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {ep.animeTitle} · <span className="text-slate-500">{ep.episodeTitle}</span>
                  </p>
                </div>
                <span className="text-xs font-black text-slate-900 whitespace-nowrap">{ep.commentCount} 💬</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-1000 ease-out"
                  style={{ width: `${(ep.commentCount / maxComments) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {topEpisodes.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-4 italic">Không có bình luận nào gần đây.</p>
          )}
        </div>
      </LightPanel>
    </div>
  );
}
