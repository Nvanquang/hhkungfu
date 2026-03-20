// Tập trung các React Query call cho trang Search: suggestions khi đang gõ, kết quả chính khi submit, và trending khi không có kết quả.
import { useQuery } from "@tanstack/react-query";
import { animeService } from "@/services/animeService";

export function useSearchData(debouncedInput: string, committedQ: string, isFocused: boolean) {
  const { data: suggestionRes, isLoading: isSuggestionLoading } = useQuery({
    queryKey: ["animes", "search-suggestions", { key: debouncedInput.trim() }],
    queryFn: () => animeService.searchAnimes({ key: debouncedInput.trim(), page: 1, limit: 5 }),
    enabled: isFocused && debouncedInput.trim().length > 0,
    staleTime: 30_000,
  });
  const suggestions = suggestionRes?.data?.items ?? [];

  const {
    data: resultsRes,
    isLoading: isResultsLoading,
    isError: isResultsError,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ["animes", "search-results", { key: committedQ, page: 1, limit: 20 }],
    queryFn: () => animeService.searchAnimes({ key: committedQ, page: 1, limit: 20 }),
    enabled: committedQ.length > 0,
    staleTime: 30_000,
  });
  const results = resultsRes?.data?.items ?? [];
  const pagination = resultsRes?.data?.pagination;
  const meta = (() => {
    const data: unknown = resultsRes?.data as unknown;
    if (!data || typeof data !== "object") return undefined;
    const metaUnknown = (data as { meta?: unknown }).meta;
    if (!metaUnknown || typeof metaUnknown !== "object") return undefined;
    const engine = "engine" in metaUnknown ? (metaUnknown as { engine?: unknown }).engine : undefined;
    const query = "query" in metaUnknown ? (metaUnknown as { query?: unknown }).query : undefined;
    return {
      engine: typeof engine === "string" ? engine : undefined,
      query: typeof query === "string" ? query : undefined,
    };
  })();

  const { data: trendingRes } = useQuery({
    queryKey: ["animes", "trending", { limit: 10 }],
    queryFn: () => animeService.getTrending(10),
    staleTime: 60_000,
  });
  const trending = trendingRes?.data?.items ?? [];

  return {
    suggestions, isSuggestionLoading,
    results, pagination, meta, isResultsLoading, isResultsError, refetchResults,
    trending,
  };
}