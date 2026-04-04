import React, { useState, useEffect } from "react";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Search,
  MessageSquare,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { adminService } from "@/services/adminService";
import type { AdminRatingStatsListData, AdminRatingSummary } from "@/types/admin.types";
import { LightPanel } from "@/pages/admin/shared/components/LightPanel";
import { Button, Input } from "@/components/ui";
import { ScoreHistogram } from "./ScoreHistogram";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RatingTabProps {
  isActive: boolean;
}

export function RatingTab({ isActive }: RatingTabProps) {
  const [data, setData] = useState<AdminRatingStatsListData | null>(null);
  const [summary, setSummary] = useState<AdminRatingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchStats = async (searchTerm: string = "", currentPage: number = 1) => {
    try {
      setLoading(true);
      const res = await adminService.listRatingStats(currentPage, 15, searchTerm);
      setData(res);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thống kê đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(search);
    setPage(1);
    fetchStats(search, 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await adminService.getRatingSummary();
      setSummary(res);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải tổng quan đánh giá");
    }
  };

  useEffect(() => {
    if (!isActive) return;
    fetchSummary();
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    fetchStats(searchQuery, page);
  }, [isActive, page, searchQuery]);

  return (
    <div className="space-y-6">

      {/* Overview Stats (Simplified but elegant) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Trung bình hệ thống", value: summary?.averageScore?.toFixed(2) ?? "-", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Tổng lượt đánh giá", value: summary?.totalRatings?.toLocaleString() ?? "-", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tỷ lệ tích cực", value: summary ? `${summary.positiveRatio.toFixed(1)}%` : "-", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Xu hướng tháng", value: summary ? `${summary.monthlyTrend >= 0 ? "+" : ""}${summary.monthlyTrend.toFixed(1)}%` : "-", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <LightPanel key={i} className="p-4 flex items-center gap-4 border-slate-100 shadow-lg shadow-slate-200/40">
            <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <h3 className="text-xl font-bold text-slate-900 leading-none">{stat.value}</h3>
            </div>
          </LightPanel>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm tên anime..."
              className="pl-10 h-10 border-slate-200 bg-white rounded-xl focus:ring-blue-500/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="h-10 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            Tìm
          </Button>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Tổng: {data?.pagination.total.toLocaleString()} đánh giá
        </div>
      </div>

      <LightPanel className="p-0 overflow-hidden border-slate-100 shadow-xl shadow-slate-200/40 rounded-2xl ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="w-12 px-6 py-4 border-b border-slate-100">#</th>
                <th className="px-6 py-4 border-b border-slate-100">Anime</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Đánh giá TB</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Số lượt</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Phân phối</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8">
                      <div className="h-10 bg-slate-100 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : !data?.items || data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <BarChart3 className="h-10 w-10 opacity-20" />
                      <p className="text-lg font-medium">Không tìm thấy dữ liệu đánh giá</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((stat, index) => (
                  <React.Fragment key={stat.animeId}>
                    <tr
                      className={cn(
                        "group transition-all duration-200 cursor-pointer overflow-hidden",
                        expandedRow === stat.animeId ? "bg-slate-50/80" : "hover:bg-slate-50"
                      )}
                      onClick={() => setExpandedRow(expandedRow === stat.animeId ? null : stat.animeId)}
                    >
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{(page - 1) * 15 + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">{stat.animeTitleVi}</span>
                          {stat.countTrend !== 0 && (
                            <span className={cn(
                              "text-[10px] font-bold flex items-center gap-1 mt-0.5",
                              stat.countTrend > 0 ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {stat.countTrend > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {stat.countTrend > 0 ? "▲" : "▼"} {Math.abs(stat.countTrend).toFixed(1)}% so với tháng trước
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {stat.averageScore.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-600">
                        {stat.totalRatings.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <ScoreHistogram distribution={stat.scoreDistribution} total={stat.totalRatings} variant="spark" />
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-widest transition-colors",
                            expandedRow === stat.animeId ? "bg-blue-600 text-white" : "text-blue-600 bg-blue-50"
                          )}>
                            {expandedRow === stat.animeId ? "Đang xem ▲" : "Xem chi tiết ▼"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); window.open(`/anime/${stat.animeId}`, '_blank'); }}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Detail View */}
                    {expandedRow === stat.animeId && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={6} className="px-10 py-10">
                          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xl ring-1 ring-slate-100/50">
                            <div className="flex flex-col md:flex-row gap-12">
                              {/* Horizontal Bar Chart (The main feature) */}
                              <div className="flex-1 space-y-6">
                                <div className="flex items-center justify-between mb-8">
                                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-600" /> Phân phối đánh giá
                                  </h4>
                                  <div className="text-right">
                                    <div className="text-3xl font-black text-slate-900">{stat.averageScore.toFixed(2)} / 10</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Dựa trên {stat.totalRatings.toLocaleString()} lượt đánh giá</div>
                                  </div>
                                </div>

                                <ScoreHistogram distribution={stat.scoreDistribution} total={stat.totalRatings} variant="detailed" />
                              </div>

                              {/* Summary Cards */}
                              <div className="w-full md:w-80 space-y-4">
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100 space-y-2">
                                  <div className="flex justify-between items-center text-xs font-bold text-green-700 uppercase tracking-widest">
                                    <span>Tỷ lệ 5 sao (9-10)</span>
                                    <span>{stat.fiveStarPercentage.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-2 bg-green-200/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${stat.fiveStarPercentage}%` }} />
                                  </div>
                                </div>

                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-2">
                                  <div className="flex justify-between items-center text-xs font-bold text-blue-700 uppercase tracking-widest">
                                    <span>Đang xu hướng</span>
                                    <span>Tăng trưởng ▲</span>
                                  </div>
                                  <p className="text-[11px] text-blue-600 leading-relaxed italic">
                                    Lượt đánh giá tăng 32% so với 30 ngày trước. Chất lượng ổn định ở mức xuất sắc.
                                  </p>
                                </div>

                                <div className="pt-4 flex flex-col gap-2">
                                  <Button className="w-full bg-slate-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-slate-100" onClick={() => setExpandedRow(null)}>
                                    Thu gọn thông tin
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-center gap-4 bg-slate-50/30">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-xl border-slate-200 bg-white text-slate-600 disabled:opacity-30 font-bold"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Trước
            </Button>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mx-4">
              Trang {page} / {data.pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 rounded-xl border-slate-200 bg-white text-slate-600 disabled:opacity-30 font-bold"
              disabled={page === data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Sau
            </Button>
          </div>
        )}
      </LightPanel>
    </div>
  );
}
