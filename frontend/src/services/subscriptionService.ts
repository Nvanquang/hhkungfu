import { api } from "./apiClient";
import type { ApiResponse, PageResponse } from "@/types";
import type {
  SubscriptionPlanDto,
  UserSubscriptionDto,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentResultDto,
  PendingPaymentDto,
} from "@/types/subscription.types";

export const subscriptionService = {
  /** GET /subscriptions/plans — public, no auth required */
  getPlans: async (): Promise<SubscriptionPlanDto[]> => {
    const response = await api.get<ApiResponse<SubscriptionPlanDto[]>>(
      "/subscriptions/plans"
    );
    return response.data.data;
  },

  /** GET /subscriptions/me — current user's active subscription */
  getMe: async (): Promise<UserSubscriptionDto | null> => {
    const response = await api.get<ApiResponse<UserSubscriptionDto | null>>(
      "/subscriptions/me"
    );
    return response.data.data;
  },

  /**
   * POST /subscriptions/initiate — create payment session
   * Returns paymentUrl to redirect user to VNPay/MoMo
   */
  initiatePayment: async (
    req: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> => {
    const response = await api.post<ApiResponse<InitiatePaymentResponse>>(
      "/subscriptions/initiate",
      req
    );
    return response.data.data;
  },

  upgradeSubscription: async (
    req: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> => {
    const response = await api.post<ApiResponse<InitiatePaymentResponse>>(
      "/subscriptions/upgrade",
      req
    );
    return response.data.data;
  },

  cancelSubscription: async (): Promise<void> => {
    await api.post<ApiResponse<void>>("/subscriptions/cancel");
  },

  /** GET /payments/result?orderCode=xxx — poll payment status */
  getPaymentResult: async (orderCode: string): Promise<PaymentResultDto> => {
    const response = await api.get<ApiResponse<PaymentResultDto>>(
      "/payments/result",
      { params: { orderCode } }
    );
    return response.data.data;
  },

  /** GET /payments/history — get user's payment history */
  getPaymentHistory: async (params: { page: number; limit: number }): Promise<PageResponse<PaymentResultDto>> => {
    const response = await api.get<ApiResponse<PageResponse<PaymentResultDto>>>(
      "/payments/history", { params }
    );
    return response.data.data;
  },

  /** GET /subscriptions/pending — get user's active pending payment */
  getPendingPayment: async (): Promise<PendingPaymentDto | null> => {
    const response = await api.get<ApiResponse<PendingPaymentDto | null>>(
      "/subscriptions/pending"
    );
    return response.data.data;
  },

  /** POST /subscriptions/pending/cancel — cancel the user's active pending payment */
  cancelPendingPayment: async (): Promise<void> => {
    await api.post<ApiResponse<void>>("/subscriptions/pending/cancel");
  },
};

