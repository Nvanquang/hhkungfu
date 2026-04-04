import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminService } from "@/services/adminService";
import type { Range } from "../analytics.constants";
import { toast } from "sonner";

export function useAnalytics() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<Range>("week");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "analytics", range],
    queryFn: () => adminService.getAnalyticsViews(range, 10),
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: number) => adminService.retryTranscode(jobId),
    onSuccess: () => {
      toast.success("Đã yêu cầu chạy lại transcode");
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics"] });
    },
    onError: () => {
      toast.error("Không thể yêu cầu chạy lại transcode");
    },
  });

  return {
    range,
    setRange,
    data,
    isLoading,
    error,
    retry: retryMutation.mutate,
    isRetrying: retryMutation.isPending,
  };
}
