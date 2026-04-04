import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { animeService } from "@/services/animeService";
import type { AnimeQueryParams } from "@/types/anime.types";

export function useCatalogData(params: AnimeQueryParams) {
  const { data: genresRes } = useQuery({
    queryKey: ["genres"],
    queryFn: animeService.getGenres,
    staleTime: 60 * 60_000,
  });
  const genres = useMemo(() => genresRes?.data ?? [], [genresRes]);

  const {
    data: animesRes,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["animes", params],
    queryFn: () => animeService.getAnimes(params),
    staleTime: 30_000,
  });

  const items = animesRes?.data?.items ?? [];
  const pagination = animesRes?.data?.pagination;

  return { genres, items, pagination, isLoading, isError, isFetching, refetch };
}

// Gọi API lấy danh sách anime và genres qua React Query, trả về items, pagination, genres cùng các trạng thái loading/error.