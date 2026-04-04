export type AdminPeriod = "today" | "week" | "month";
export type AdminRole = "USER" | "ADMIN";

export interface DashboardTranscodeJobsSummary {
  pending: number;
  running: number;
  failedLast24h: number;
}

export interface DashboardTopAnimeView {
  id: number;
  title: string;
  viewCount: number;
}

export interface DashboardRecentActivityItem {
  type: string;
  message: string;
  at: string;
}

export interface DashboardData {
  totalAnimes: number;
  totalEpisodes: number;
  totalUsers: number;
  totalViews: number;
  newUsersToday: number;
  viewsToday: number;
  revenueThisMonth: number;
  newSubscriptionsToday: number;
  transcodeJobs: DashboardTranscodeJobsSummary;
  topAnimes: DashboardTopAnimeView[];
  recentActivity: DashboardRecentActivityItem[];
}

export interface AnalyticsTopAnime {
  id: number;
  title: string;
  views: number;
}

export interface AnalyticsTopGenre {
  name: string;
  nameVi: string;
  views: number;
}

export interface AnalyticsDailyViews {
  date: string;
  views: number;
}

export interface AnalyticsDailyRevenue {
  date: string;
  amount: number;
}

export interface AnalyticsPlanRevenue {
  planName: string;
  amount: number;
  orderCount: number;
}

export interface AnalyticsGatewayRatio {
  gateway: string;
  amount: number;
  percentage: number;
}

export interface AnalyticsTopEpisodeComment {
  episodeId: number;
  episodeTitle: string;
  animeTitle: string;
  commentCount: number;
}

export interface AnalyticsSubscriptionStats {
  revenueByPlan: AnalyticsPlanRevenue[];
  gatewayStats: AnalyticsGatewayRatio[];
}

export interface AnalyticsEngagementStats {
  totalComments: number;
  commentsDelta: number;
  totalRatings: number;
  ratingsDelta: number;
  topCommentedEpisodes: AnalyticsTopEpisodeComment[];
}

export interface AnalyticsRecentFailedJob {
  jobId: number;
  episodeId: number;
  error: string;
  at: string;
}

export interface AnalyticsTranscodeHealth {
  totalJobs: number;
  successJobs: number;
  failedJobs: number;
  activeJobs: number;
  successRate: number;
  recentFailed: AnalyticsRecentFailedJob[];
}

export interface AnalyticsViewsData {
  period: string;
  totalViews: number;
  viewsDelta: number;
  totalRevenue: number;
  revenueDelta: number;
  newUsers: number;
  usersDelta: number;
  activeVipUsers: number;
  vipDelta: number;
  topAnimes: AnalyticsTopAnime[];
  topGenres: AnalyticsTopGenre[];
  viewsChart: AnalyticsDailyViews[];
  revenueChart: AnalyticsDailyRevenue[];
  subscriptionStats: AnalyticsSubscriptionStats;
  engagementStats: AnalyticsEngagementStats;
  transcodeHealth: AnalyticsTranscodeHealth;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: AdminRole;
  active: boolean;
  emailVerified: boolean;
  provider: "LOCAL" | "GOOGLE";
  vip: boolean;
  vipExpiresAt: string | null;
  totalWatched: number;
  createdAt: string;
}

export interface AdminUserListData {
  items: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminPayment {
  orderId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  planName: string;
  amount: number;
  gateway: string;
  status: string; // From PaymentStatus
  createdAt: string;
  paidAt: string | null;
  gatewayResponse?: string; // JSON string
}

export interface AdminPaymentListData {
  items: AdminPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserSubscription {
  id: number;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  planName: string;
  startedAt: string | null;
  expiresAt: string | null;
  status: string; // From SubscriptionStatus
  remainingDays: number;
  progress: number; // 0-100
}

export interface AdminUserSubscriptionListData {
  items: AdminUserSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminSubscriptionSummary {
  monthlyRevenue: number;
  revenueDelta: number; // percentage
  successOrderCount: number;
  totalOrderCount: number;
  successRate: number; // percentage
  activeVipCount: number;
  vipDelta: number; // percentage
}

export interface PatchUserRoleRequest {
  role: AdminRole;
}

export interface PatchUserRoleResponse {
  id: string;
  role: AdminRole;
}

export interface PatchUserStatusRequest {
  isActive: boolean;
}

export interface PatchAnimeFeaturedRequest {
  isFeatured: boolean;
}

export interface ImageUploadData {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface AdminComment {
  id: number;
  content: string;
  likeCount: number;
  isPinned: boolean;
  replyCount: number;
  createdAt: string;
  deletedAt: string | null;
  episodeId: number;
  episodeNumber: number;
  animeId: number;
  animeName: string;
  parentId: number | null;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface AdminCommentListData {
  items: AdminComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminRatingStats {
  animeId: number;
  animeTitleVi: string;
  averageScore: number;
  totalRatings: number;
  fiveStarPercentage: number;
  scoreDistribution: Record<number, number>;
  countTrend: number;
}

export interface AdminRatingSummary {
  averageScore: number;
  totalRatings: number;
  positiveRatio: number;
  monthlyTrend: number;
}

export interface AdminRatingStatsListData {
  items: AdminRatingStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
