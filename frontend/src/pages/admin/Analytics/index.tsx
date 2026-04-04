import { Loader2, TrendingUp, Users, DollarSign, Zap } from "lucide-react";
import { useAnalytics } from "@/pages/admin/Analytics/hooks/useAnalytics";
import { RANGES } from "@/pages/admin/Analytics/analytics.constants";
import { SummaryCard } from "@/pages/admin/Analytics/components/SummaryCard";
import { AnalyticsMainChart } from "@/pages/admin/Analytics/components/AnalyticsMainChart";
import { TopLists } from "@/pages/admin/Analytics/components/TopLists";
import { PipelineStatus } from "@/pages/admin/Analytics/components/PipelineStatus";
import { FailedJobsTable } from "@/pages/admin/Analytics/components/FailedJobsTable";
import { SubscriptionSection } from "@/pages/admin/Analytics/components/SubscriptionSection";
import { EngagementSection } from "@/pages/admin/Analytics/components/EngagementSection";
import { AdminPageHeader } from "@/pages/admin/shared/components";

export default function AnalyticsPage() {
  const { range, setRange, data, isLoading, retry } = useAnalytics();

  if (isLoading && !data) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Đang tải dữ liệu phân tích...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Tổng lượt xem",
      value: data?.totalViews ?? 0,
      delta: data?.viewsDelta,
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Người dùng mới",
      value: data?.newUsers ?? 0,
      delta: data?.usersDelta,
      icon: Users,
      color: "indigo",
    },
    {
      title: "Doanh thu",
      value: data?.totalRevenue ?? 0,
      delta: data?.revenueDelta,
      suffix: "đ",
      icon: DollarSign,
      color: "emerald",
    },
    {
      title: "VIP hoạt động",
      value: data?.activeVipUsers ?? 0,
      delta: data?.vipDelta,
      icon: Zap,
      color: "amber",
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Thống kê hệ thống"
        description="Theo dõi hiệu suất nội dung, tăng trưởng người dùng và doanh thu theo thời gian."
        rightElement={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 w-fit">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${range === r.value
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <SummaryCard key={i} {...(s as any)} />
        ))}
      </div>

      {/* Main Chart & Top Lists */}
      <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
        <div className="space-y-6">
          <AnalyticsMainChart
            viewsData={data?.viewsChart ?? []}
            revenueData={data?.revenueChart ?? []}
          />

          <SubscriptionSection
            plans={data?.subscriptionStats.revenueByPlan ?? []}
            gateways={data?.subscriptionStats.gatewayStats ?? []}
          />

          <EngagementSection
            comments={data?.engagementStats.totalComments ?? 0}
            commentsDelta={data?.engagementStats.commentsDelta ?? 0}
            ratings={data?.engagementStats.totalRatings ?? 0}
            ratingsDelta={data?.engagementStats.ratingsDelta ?? 0}
            topEpisodes={data?.engagementStats.topCommentedEpisodes ?? []}
          />
        </div>

        <div className="space-y-6">
          <TopLists
            animes={(data?.topAnimes ?? []).slice(0, 8) as any}
            genres={(data?.topGenres ?? []).slice(0, 10) as any}
            totalViews={data?.totalViews ?? 0}
          />

          <PipelineStatus
            totalJobs={data?.transcodeHealth.totalJobs ?? 0}
            successJobs={data?.transcodeHealth.successJobs ?? 0}
            failedJobs={data?.transcodeHealth.failedJobs ?? 0}
            activeJobs={data?.transcodeHealth.activeJobs ?? 0}
            successRate={data?.transcodeHealth.successRate ?? 0}
          />

          <FailedJobsTable
            jobs={data?.transcodeHealth.recentFailed as any ?? []}
            onRetry={retry}
          />
        </div>
      </div>
    </div>
  );
}

