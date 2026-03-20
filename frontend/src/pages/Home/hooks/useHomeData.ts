// Tập trung toàn bộ các React Query call của trang Home vào một hook, trả về data, loading state cho từng section.
// activeGenre=null nghĩa là chưa chọn, hook tự fallback về genres[0] cho genre query.
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { animeService } from "@/services/animeService";

export function useHomeData(activeGenre: string | null) {
  const { data: featuredRes, isLoading: isFeaturedLoading, isError: isFeaturedError } = useQuery({
    queryKey: ["animes", "featured"],
    queryFn: animeService.getFeatured,
    staleTime: 10 * 60_000,
  });
  const featured = featuredRes?.data?.items ?? [];

  const { data: trendingRes, isLoading: isTrendingLoading } = useQuery({
    queryKey: ["animes", "trending", { limit: 10 }],
    queryFn: () => animeService.getTrending(10),
    staleTime: 60_000,
  });
  const trending = trendingRes?.data?.items ?? [];

  const { data: recentlyRes, isLoading: isRecentlyLoading } = useQuery({
    queryKey: ["animes", "recently-updated", { page: 1, limit: 4 }],
    queryFn: () => animeService.getRecentlyUpdated({ page: 1, limit: 4 }),
    staleTime: 30_000,
  });
  const recently = recentlyRes?.data?.items ?? [];

  const { data: genresRes, isLoading: isGenresLoading } = useQuery({
    queryKey: ["genres"],
    queryFn: animeService.getGenres,
    staleTime: 60 * 60_000,
  });
  const genres = useMemo(() => genresRes?.data?.items ?? [], [genresRes]);

  // Nếu chưa chọn genre thì fallback về genres[0]
  const effectiveGenreForQuery = activeGenre ?? genres[0]?.slug ?? null;

  const { data: genreAnimesRes, isLoading: isGenreAnimesLoading } = useQuery({
    queryKey: ["animes", { genre: effectiveGenreForQuery, page: 1, limit: 12, sort: "viewCount", order: "desc" }],
    queryFn: () =>
      animeService.getAnimes({
        genre: effectiveGenreForQuery ?? undefined,
        page: 1,
        limit: 12,
        sort: "viewCount",
        order: "desc",
      }),
    enabled: effectiveGenreForQuery != null,
    staleTime: 60_000,
  });
  const genreAnimes = genreAnimesRes?.data?.items ?? [];

  return {
    featured, isFeaturedLoading, isFeaturedError,
    trending, isTrendingLoading,
    recently, isRecentlyLoading,
    genres, isGenresLoading,
    genreAnimes, isGenreAnimesLoading,
  };
}