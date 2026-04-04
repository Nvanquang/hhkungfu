import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import type { SubscriptionPlanDto } from "@/types/subscription.types";

const QUERY_KEYS = {
  plans: ["admin", "subscriptions", "plans"],
  summary: ["admin", "subscriptions", "summary"],
  payments: (params: any) => ["admin", "subscriptions", "payments", params],
  vips: (params: any) => ["admin", "subscriptions", "vips", params],
} as const;

export function useAdminPlans() {
  const queryClient = useQueryClient();

  const { data: plans, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.plans,
    queryFn: () => adminService.listPlans(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminService.togglePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
      toast.success("Đã cập nhật trạng thái gói");
    },
    onError: () => toast.error("Lỗi khi cập nhật trạng thái gói"),
  });

  return { plans, isLoading, error, togglePlan: toggleMutation.mutate };
}

export function useAdminSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.summary,
    queryFn: () => adminService.getSubscriptionSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminPayments(params: { page: number; limit: number; search?: string; gateway?: string; status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.payments(params),
    queryFn: () => adminService.listPayments(params),
  });
}

export function useAdminVipMembers(params: { page: number; limit: number; search?: string; planId?: number; status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.vips(params),
    queryFn: () => adminService.listVipSubscriptions(params),
  });
}

// Thêm vào file useAdminSubscriptions.ts (bổ sung hook usePlanMutations)

export function usePlanMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (dto: Partial<SubscriptionPlanDto>) => adminService.createPlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
      toast.success("Đã tạo gói VIP mới");
    },
    onError: () => toast.error("Lỗi khi tạo gói VIP"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<SubscriptionPlanDto> }) =>
      adminService.updatePlan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
      toast.success("Đã cập nhật gói VIP");
    },
    onError: () => toast.error("Lỗi khi cập nhật gói VIP"),
  });

  return {
    createPlan: createMutation.mutate,
    updatePlan: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
