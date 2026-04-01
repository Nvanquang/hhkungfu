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
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.me(),
    queryFn: subscriptionService.getMe,
    enabled: isLoggedIn,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingPayment() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.pending(),
    queryFn: subscriptionService.getPendingPayment,
    enabled: isLoggedIn,
    retry: false,
  });
}
