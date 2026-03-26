import { useQuery } from "@tanstack/react-query";
import { animeService } from "@/services/animeService";
import { watchService } from "@/services/watchService";

const STALE_5MIN = 5 * 60_000;

export function useWatch(animeSlug: string, episodeNumberStr: string) {
  const episodeNumber = parseInt(episodeNumberStr, 10);

  // Step 1: Fetch anime by slug to get animeId
  const animeQuery = useQuery({
    queryKey: ["anime", animeSlug],
    queryFn: () => animeService.getAnimeBySlug(animeSlug),
    enabled: !!animeSlug,
    staleTime: STALE_5MIN,
  });

  const anime = animeQuery.data?.data ?? null;
  const animeId = anime?.id ?? null;

  // Step 2a: Fetch the specific episode by number (sequential, blocking)
  const episodeQuery = useQuery({
    queryKey: ["episode", animeId, episodeNumber],
    queryFn: () => watchService.getEpisodeByNumber(animeId!, episodeNumber),
    enabled: !!animeId && !isNaN(episodeNumber),
    staleTime: STALE_5MIN,
  });

  const episode = episodeQuery.data ?? null;
  const episodeId = episode?.id ?? null;

  // Step 2b: Fetch full episodes list for sidebar (NON-blocking, runs in parallel with stream-info)
  const episodesQuery = useQuery({
    queryKey: ["episodes", animeId],
    queryFn: () => watchService.getEpisodes(animeId!, { limit: 200, order: "asc" }),
    enabled: !!animeId,
    staleTime: STALE_5MIN,
  });

  const episodes = episodesQuery.data?.items ?? [];

  // Step 3: Fetch stream-info once we have the episodeId (runs in parallel with episodes list)
  const streamQuery = useQuery({
    queryKey: ["stream-info", episodeId],
    queryFn: () => watchService.getStreamInfo(episodeId!),
    enabled: !!episodeId && episode?.videoStatus === "READY",
    staleTime: STALE_5MIN,
    retry: false, // Don't retry VIP_REQUIRED errors
  });

  const streamInfo = streamQuery.data ?? null;

  // Resolve next/prev episode from list
  const sortedEpisodes = [...episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);
  const currentIndex = sortedEpisodes.findIndex((ep) => ep.episodeNumber === episodeNumber);
  const prevEpisode = currentIndex > 0 ? sortedEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex >= 0 && currentIndex < sortedEpisodes.length - 1
    ? sortedEpisodes[currentIndex + 1]
    : null;

  // Detect VIP error from stream query
  const streamError = streamQuery.error as { response?: { data?: { error?: { code?: string } } } } | null;
  const isVipRequired =
    streamQuery.isError &&
    streamError?.response?.data?.error?.code === "VIP_REQUIRED";

  const isNotReady =
    !!episode && episode.videoStatus !== "READY" && !isVipRequired;

  return {
    anime,
    episode,
    episodes: sortedEpisodes,
    streamInfo,
    prevEpisode,
    nextEpisode,
    animeId,
    episodeId,
    isLoading: animeQuery.isLoading || episodeQuery.isLoading,
    isError: animeQuery.isError || episodeQuery.isError,
    isStreamLoading: streamQuery.isLoading,
    isVipRequired,
    isNotReady,
    refetch: episodeQuery.refetch,
  };
}
