import { api } from "./apiClient";
import type { PageResponse, ApiResponse } from "@/types";
import type { AnimeSummary, AnimeDetail, Genre, Studio, AnimeQueryParams, CreateAnimeRequest } from "@/types/anime.types";

export const animeService = {
  getAnimes: async (params?: AnimeQueryParams) => {
    const response = await api.get<ApiResponse<PageResponse<AnimeSummary>>>("/animes", { params });
    return response.data;
  },

  getAnimeBySlug: async (slug: string) => {
    const response = await api.get<ApiResponse<AnimeDetail>>(`/animes/${slug}`);
    return response.data;
  },

  getAnimeById: async (id: number) => {
    const response = await api.get<ApiResponse<AnimeDetail>>(`/animes/${id}`);
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
    const response = await api.get<ApiResponse<Genre[]>>("/genres");
    return response.data;
  },

  createGenre: async (payload: { name: string; nameVi?: string; slug: string }) => {
    const response = await api.post<ApiResponse<Genre>>("/genres", payload);
    return response.data;
  },

  updateGenre: async (id: number, payload: { name: string; nameVi?: string; slug: string }) => {
    const response = await api.put<ApiResponse<Genre>>(`/genres/${id}`, payload);
    return response.data;
  },

  deleteGenre: async (id: number) => {
    await api.delete(`/genres/${id}`);
  },

  getStudios: async () => {
    const response = await api.get<ApiResponse<Studio[]>>("/studios");
    return response.data;
  },

  createStudio: async (payload: { name: string; logoUrl?: string }) => {
    const response = await api.post<ApiResponse<Studio>>("/studios", payload);
    return response.data;
  },

  updateStudio: async (id: number, payload: { name: string; logoUrl?: string }) => {
    const response = await api.put<ApiResponse<Studio>>(`/studios/${id}`, payload);
    return response.data;
  },

  deleteStudio: async (id: number) => {
    await api.delete(`/studios/${id}`);
  },

  /** POST /api/v1/animes – Yêu cầu role ADMIN */
  createAnime: async (payload: CreateAnimeRequest) => {
    const response = await api.post<ApiResponse<AnimeDetail>>("/animes", payload);
    return response.data;
  },

  /** PUT /api/v1/animes/:id – Yêu cầu role ADMIN */
  updateAnime: async (id: number, payload: Partial<CreateAnimeRequest>) => {
    const response = await api.put<ApiResponse<AnimeDetail>>(`/animes/${id}`, payload);
    return response.data;
  },

  /** DELETE /api/v1/animes/:id – Yêu cầu role ADMIN */
  deleteAnime: async (id: number) => {
    await api.delete(`/animes/${id}`);
  },

  /** PATCH /api/v1/admin/animes/:id/image – Upload ảnh (Thumbnail/Banner) */
  uploadAnimeImage: async (id: number, file: File, type: "THUMBNAIL" | "BANNER") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    
    const response = await api.patch(`/admin/animes/${id}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

