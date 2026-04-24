import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { watchService } from "@/services/watchService";
import { animeService } from "@/services/animeService";
import type {
  CreateEpisodeRequest,
} from "@/types/episode.types";

export const useEpisodeManager = (animeId: number) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── UI States (URL-driven) ────────────────────────────────────────────────
  const panelMode = searchParams.get("panel"); // 'new' | null
  const historyEpisodeId = searchParams.get("history") ? Number(searchParams.get("history")) : null;

  const openNewPanel = () => setSearchParams({ panel: "new" });
  const closePanel = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("panel");
    setSearchParams(params);
  };

  const openHistory = (id: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("history", id.toString());
    setSearchParams(params);
  };

  const closeHistory = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("history");
    setSearchParams(params);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const animeQuery = useQuery({
    queryKey: ["admin", "anime", animeId],
    queryFn: () => animeService.getAnimeBySlug(animeId.toString()),
    enabled: animeId > 0,
    staleTime: 60_000,
  });

  const episodesQuery = useQuery({
    queryKey: ["admin", "episodes", animeId],
    queryFn: () => watchService.getEpisodes(animeId, { page: 1, limit: 20, sort: "desc" }),
    enabled: animeId > 0,
    refetchOnWindowFocus: false, // Không tải lại khi quay lại tab
    staleTime: 5 * 60 * 1000,    // Giữ dữ liệu "tươi" trong 5 phút
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: CreateEpisodeRequest) =>
      watchService.createEpisode(animeId, payload),
    onSuccess: () => {
      toast.success("Tạo tập phim mới thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin", "episodes", animeId] });
      closePanel();
    },
    onError: () => toast.error("Tạo tập thất bại. Vui lòng thử lại."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => watchService.deleteEpisode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "episodes", animeId] });
      toast.success("Đã xóa tập phim");
    },
    onError: () => toast.error("Lỗi khi xóa tập phim"),
  });

  return {
    animeQuery,
    episodesQuery,
    createMutation,
    deleteMutation,
    panelMode,
    historyEpisodeId,
    openNewPanel,
    closePanel,
    openHistory,
    closeHistory,
  };
};
