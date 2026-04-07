import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscriptionService";
import { useAuthStore } from "@/store/authStore";

export const SUBSCRIPTION_KEYS = {
  plans: () => ["subscriptions", "plans"] as const,
  me: () => ["subscriptions", "me"] as const,
  pending: () => ["subscriptions", "pending"] as const,
  result: (orderCode: string) => ["payments", "result", orderCode] as const,
};

export function useVipPlans() {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.plans(),
    queryFn: subscriptionService.getPlans,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMySubscription() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.me(),
    queryFn: subscriptionService.getMe,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingPayment() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.pending(),
    queryFn: subscriptionService.getPendingPayment,
    enabled: isAuthenticated,
    retry: false,
  });
}
