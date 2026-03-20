// Fetch chi tiết anime và danh sách anime liên quan theo slug, trả về anime, related, và các trạng thái loading/error.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { animeService } from "@/services/animeService";

export function useAnimeDetail(idOrSlug: string) {
  const { data: animeRes, isLoading, isError, refetch } = useQuery({
    queryKey: ["anime", idOrSlug],
    queryFn: () => animeService.getAnimeBySlug(idOrSlug),
    enabled: !!idOrSlug,
    staleTime: 5 * 60_000,
  });

  const anime = animeRes?.data;

  const { data: relatedRes, isLoading: isRelatedLoading } = useQuery({
    queryKey: ["animes", "related", anime?.id, { limit: 8 }],
    queryFn: () => animeService.getRelated(anime!.id, 8),
    enabled: !!anime?.id,
    staleTime: 5 * 60_000,
  });

  const related = relatedRes?.data?.items ?? [];

  const titleOther = useMemo(
    () => (anime?.titleOther?.length ? anime.titleOther[0] : null),
    [anime?.titleOther]
  );

  const mockEpisodeCount = anime?.totalEpisodes ? Math.min(anime.totalEpisodes, 24) : 24;

  return { anime, related, titleOther, mockEpisodeCount, isLoading, isError, isRelatedLoading, refetch };
}