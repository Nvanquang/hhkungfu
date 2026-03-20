import { api } from "./apiClient";
import type { PageResponse, ApiResponse } from "@/types";
import type { AnimeSummary, AnimeDetail, Genre, Studio, AnimeQueryParams } from "@/types/anime.types";

export const animeService = {
  getAnimes: async (params?: AnimeQueryParams) => {
    const response = await api.get<ApiResponse<PageResponse<AnimeSummary>>>("/animes", { params });
    return response.data;
  },

  getAnimeBySlug: async (slug: string) => {
    const response = await api.get<ApiResponse<AnimeDetail>>(`/animes/${slug}`);
    return response.data;
  },

  searchAnimes: async (params?: AnimeQueryParams) => {
    const response = await api.get<ApiResponse<PageResponse<AnimeSummary>>>("/animes/search", {params});
    return response.data;
  },

  getTrending: async (limit?: number) => {
    const response = await api.get<ApiResponse<{ items: AnimeSummary[], meta: PageResponse<AnimeSummary>["pagination"] }>>("/animes/trending", {
      params: { limit },
    });
    return response.data;
  },

  getFeatured: async () => {
    const response = await api.get<ApiResponse<{ items: AnimeSummary[] }>>("/animes/featured");
    return response.data;
  },

  getRecentlyUpdated: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<PageResponse<AnimeSummary>>>("/animes/recently-updated", { params });
    return response.data;
  },

  getRelated: async (id: number, limit?: number) => {
    const response = await api.get<ApiResponse<{ items: AnimeSummary[] }>>(`/animes/${id}/related`, {
      params: { limit },
    });
    return response.data;
  },

  getGenres: async () => {
    const response = await api.get("/genres");
    const rawData = response.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.items || rawData?.data || []);
    return { data: { items: items as Genre[] } };
  },

  getStudios: async () => {
    const response = await api.get<ApiResponse<{ items: Studio[] }>>("/studios");
    return response.data;
  }
};
