export type PaymentGateway = "VNPAY" | "MOMO";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "EXPIRED" | "CANCELLED";

export type SubscriptionStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface SubscriptionPlanDto {
  id: number;
  name: string;
  durationDays: number;
  price: number;
  originalPrice: number | null;
  description: string | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface UserSubscriptionDto {
  id: number;
  planName: string;
  status: SubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
}

export interface InitiatePaymentRequest {
  planId: number;
  gateway: PaymentGateway;
}

export interface InitiatePaymentResponse {
  paymentUrl: string;
  orderId: string;
  expiresIn: number;
}

export interface PaymentResultDto {
  orderId: string;
  status: PaymentStatus;
  planName: string;
  amount: number;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

export interface PendingPaymentDto {
  planId: number;
  planName: string;
  gateway: PaymentGateway;
  amount: number;
  orderCode: string;
  expiresIn: number;
}

