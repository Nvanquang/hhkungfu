import { api } from "./apiClient";
import type { ApiResponse } from "@/types/api.types";
import type {
  AdminPeriod,
  AnalyticsViewsData,
  DashboardData,
  AdminUserListData,
  AdminRole,
  PatchUserRoleResponse,
  PatchAnimeFeaturedRequest,
  ImageUploadData,
  AdminCommentListData,
  AdminRatingStatsListData,
  AdminRatingSummary,
  AdminPaymentListData,
  AdminUserSubscriptionListData,
  AdminSubscriptionSummary,
} from "@/types/admin.types";
import type { SubscriptionPlanDto } from "@/types/subscription.types";

interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: AdminRole;
  isActive?: boolean;
}

interface ListCommentsParams {
  page?: number;
  limit?: number;
  search?: string;
  username?: string;
  animeId?: number;
  type?: string;
  isDeleted?: boolean;
}

interface ListPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  gateway?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface ListVipSubscriptionsParams {
  page?: number;
  limit?: number;
  search?: string;
  planId?: number;
  status?: string;
}

export const adminService = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await api.get<ApiResponse<DashboardData>>("/admin/dashboard");
    return data.data;
  },

  getAnalyticsViews: async (period: AdminPeriod, limit = 10): Promise<AnalyticsViewsData> => {
    const { data } = await api.get<ApiResponse<AnalyticsViewsData>>("/admin/analytics/views", {
      params: { period, limit },
    });
    return data.data;
  },

  retryTranscode: async (jobId: number): Promise<void> => {
    await api.post(`/admin/analytics/jobs/${jobId}/retry`);
  },

  listUsers: async (params: ListUsersParams): Promise<AdminUserListData> => {
    const { data } = await api.get<ApiResponse<AdminUserListData>>("/admin/users", { params });
    return data.data;
  },

  updateUserRole: async (id: string, role: AdminRole): Promise<PatchUserRoleResponse> => {
    const { data } = await api.patch<ApiResponse<PatchUserRoleResponse>>(`/admin/users/${id}/role`, { role });
    return data.data;
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<void> => {
    const { data } = await api.patch<ApiResponse<void>>(`/admin/users/${id}/status`, { isActive });
    return data.data;
  },

  updateAnimeFeatured: async (id: number, payload: PatchAnimeFeaturedRequest): Promise<ApiResponse<void>> => {
    const { data } = await api.patch<ApiResponse<void>>(`/admin/animes/${id}/featured`, payload);
    return data;
  },

  uploadImage: async (file: File, folder: string): Promise<ImageUploadData> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const { data } = await api.post<ApiResponse<ImageUploadData>>("/admin/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  listComments: async (params: ListCommentsParams): Promise<AdminCommentListData> => {
    const { data } = await api.get<ApiResponse<AdminCommentListData>>("/admin/comments", { params });
    return data.data;
  },

  togglePinComment: async (id: number): Promise<void> => {
    await api.patch(`/admin/comments/${id}/pin`);
  },

  deleteCommentAdmin: async (id: number): Promise<void> => {
    await api.delete(`/admin/comments/${id}`);
  },

  listRatingStats: async (page = 1, limit = 10, search?: string): Promise<AdminRatingStatsListData> => {
    const { data } = await api.get<ApiResponse<AdminRatingStatsListData>>("/admin/ratings/stats", {
      params: { page, limit, search },
    });
    return data.data;
  },

  getRatingSummary: async (): Promise<AdminRatingSummary> => {
    const { data } = await api.get<ApiResponse<AdminRatingSummary>>("/admin/ratings/summary");
    return data.data;
  },

  // ── SUBSCRIPTION & PAYMENT ──────────────────────────────────────────────
  getSubscriptionSummary: async (): Promise<AdminSubscriptionSummary> => {
    const { data } = await api.get<ApiResponse<AdminSubscriptionSummary>>("/admin/subscriptions/summary");
    return data.data;
  },

  listPayments: async (params: ListPaymentsParams): Promise<AdminPaymentListData> => {
    const { data } = await api.get<ApiResponse<AdminPaymentListData>>("/admin/subscriptions/payments", { params });
    return data.data;
  },

  listVipSubscriptions: async (params: ListVipSubscriptionsParams): Promise<AdminUserSubscriptionListData> => {
    const { data } = await api.get<ApiResponse<AdminUserSubscriptionListData>>("/admin/subscriptions/vips", { params });
    return data.data;
  },

  listPlans: async (): Promise<SubscriptionPlanDto[]> => {
    const { data } = await api.get<ApiResponse<SubscriptionPlanDto[]>>("/admin/subscriptions/plans");
    return data.data;
  },

  createPlan: async (dto: Partial<SubscriptionPlanDto>): Promise<SubscriptionPlanDto> => {
    const { data } = await api.post<ApiResponse<SubscriptionPlanDto>>("/admin/subscriptions/plans", dto);
    return data.data;
  },

  updatePlan: async (id: number, dto: Partial<SubscriptionPlanDto>): Promise<SubscriptionPlanDto> => {
    const { data } = await api.put<ApiResponse<SubscriptionPlanDto>>(`/admin/subscriptions/plans/${id}`, dto);
    return data.data;
  },

  togglePlan: async (id: number): Promise<void> => {
    await api.patch(`/admin/subscriptions/plans/${id}/toggle`);
  },
};
