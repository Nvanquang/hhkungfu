import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { subscriptionService } from "@/services/subscriptionService";
import { SUBSCRIPTION_KEYS } from "@/pages/Vip/VipPlans/hooks/useVipPlans";
import { webSocketService } from "@/services/websocketService";

export function usePaymentResult() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderId") ?? searchParams.get("vnp_TxnRef") ?? "";
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const queryKey = SUBSCRIPTION_KEYS.result(orderCode);

  const query = useQuery({
    queryKey,
    queryFn: () => subscriptionService.getPaymentResult(orderCode),
    enabled: !!orderCode,
    // Poll every 5s while PENDING and under 60s (Fallback for WS)
    refetchInterval: (query) => {
      if (!query.state.data) return 5000;
      if (query.state.data.status !== "PENDING") return false;
      if (elapsedSeconds >= 60) return false;
      return 5000;
    },
  });

  // Track elapsed time to stop polling after 60s
  useEffect(() => {
    if (query.data?.status !== "PENDING") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 5);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [query.data?.status]);

  // WebSocket Subscription
  useEffect(() => {
    if (!orderCode) return;
    if (query.data && query.data.status !== "PENDING") return;

    webSocketService.connect();
    
    // Subscribe to payment topic
    const unsubscribe = webSocketService.subscribePayment(orderCode, (message) => {
      console.log("[Payment WS] Received update:", message);
      if (message && message.status) {
        // Update query data immediately for fast UI feedback
        queryClient.setQueryData(queryKey, (oldData: any) => ({
          ...(oldData || {}),
          status: message.status,
          planName: message.planName || oldData?.planName
        }));
        
        // Force refetch to sync full data from backend
        queryClient.invalidateQueries({ queryKey });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderCode, queryKey, queryClient, query.data?.status]);

  return { orderCode, result: query.data, isLoading: query.isLoading, isError: query.isError };
}
