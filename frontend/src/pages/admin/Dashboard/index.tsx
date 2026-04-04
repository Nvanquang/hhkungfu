import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Clapperboard, Eye, Film, Users } from "lucide-react";
import { adminService } from "@/services/adminService";
import { LightPanel, AnimeStatusBadge } from "@/pages/admin/shared/components";
import { StatCard } from "./components/StatCard";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminService.getDashboard,
  });

  const summary = useMemo(() => {
    const items = data?.topAnimes ?? [];
    return {
      animeCount: data?.totalAnimes ?? 0,
      topEpisodeEstimate: data?.totalEpisodes ?? 0,
      usersEstimate: data?.totalUsers ?? 0,
      views: items.reduce((sum, item) => sum + item.viewCount, 0),
      topItems: items,
      recentActivity: data?.recentActivity ?? [],
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <LightPanel className="flex items-center justify-between py-5 px-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-500 mt-0.5">Báo cáo dữ liệu trực tiếp trong tầm tay</p>
        </div>
      </LightPanel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Clapperboard className="h-5 w-5" />} label="Anime" value={summary.animeCount} />
        <StatCard icon={<Film className="h-5 w-5" />} label="Tập phim" value={summary.topEpisodeEstimate} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Người dùng" value={summary.usersEstimate} />
        <StatCard icon={<Eye className="h-5 w-5" />} label="Lượt xem (Top 5)" value={summary.views} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LightPanel className="flex flex-col">
          <h2 className="text-base font-semibold text-slate-900 mb-4 px-1">Top Anime (Lượt xem)</h2>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400 font-medium">
                  <th className="pb-3 pr-3 font-semibold uppercase text-[10px] tracking-widest">#</th>
                  <th className="pb-3 pr-3 font-semibold uppercase text-[10px] tracking-widest">Tên phim</th>
                  <th className="pb-3 pr-3 font-semibold uppercase text-[10px] tracking-widest">Lượt xem</th>
                  <th className="pb-3 font-semibold uppercase text-[10px] tracking-widest text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {(summary.topItems ?? []).map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3 pr-3 text-slate-400 font-mono text-xs">{index + 1}</td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-800">{item.title ?? "-"}</p>
                    </td>
                    <td className="py-3 pr-3 text-slate-600 font-semibold">{item.viewCount.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <AnimeStatusBadge status="ONGOING" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && summary.topItems.length === 0 && <p className="py-8 text-center text-sm text-slate-400 font-medium italic">Không có dữ liệu hiển thị.</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link to="/admin/analytics" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline px-1">
              Xem báo cáo phân tích chi tiết →
            </Link>
          </div>
        </LightPanel>

        <LightPanel>
          <h2 className="text-base font-semibold text-slate-900 mb-4 px-1">Hoạt động gần đây</h2>
          <div className="space-y-3">
            {summary.recentActivity.slice(0, 6).map((item, idx) => (
              <div key={`${item.at}-${idx}`} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-3 hover:bg-slate-50 transition border-l-4 border-l-blue-500/60">
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-800 leading-snug block">{item.message}</span>
                  <span className="mt-1 text-[11px] text-slate-400 block font-medium uppercase tracking-tighter">{item.at}</span>
                </div>
              </div>
            ))}
            {!isLoading && summary.recentActivity.length === 0 && <p className="py-8 text-center text-sm text-slate-400 font-medium italic">Chưa ghi nhận hoạt động nào.</p>}
          </div>
        </LightPanel>
      </div>
    </div>
  );
}
