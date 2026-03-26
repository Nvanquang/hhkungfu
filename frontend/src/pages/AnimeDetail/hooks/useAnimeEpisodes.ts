import { useQuery } from "@tanstack/react-query";
import { watchService } from "@/services/watchService";
import type { EpisodeQueryParams } from "@/types/episode.types";

export function useAnimeEpisodes(animeId: number, params?: EpisodeQueryParams) {
  return useQuery({
    queryKey: ["anime", animeId, "episodes", params],
    queryFn: () => watchService.getEpisodes(animeId, params),
    enabled: !!animeId,
    staleTime: 5 * 60_000, // 5 minutes
  });
}
