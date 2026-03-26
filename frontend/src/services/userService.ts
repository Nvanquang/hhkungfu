import { api } from "./apiClient";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type {
  UserProfileDto,
  WatchHistoryDto,
  BookmarkDto,
  RatingSummaryDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ConfirmChangePasswordRequest
} from "@/types/user.types";

export const userService = {
  // Profile
  getProfile: async (id: string): Promise<UserProfileDto> => {
    const { data } = await api.get<ApiResponse<UserProfileDto>>(`/users/${id}/profile`);
    return data.data;
  },

  updateProfile: async (payload: UpdateProfileRequest): Promise<UserProfileDto> => {
    const { data } = await api.patch<ApiResponse<UserProfileDto>>("/users/me/profile", payload);
    return data.data;
  },

  requestChangePassword: async (payload: ChangePasswordRequest): Promise<void> => {
    await api.post("/users/me/password-change/request", payload);
  },

  confirmChangePassword: async (payload: ConfirmChangePasswordRequest): Promise<void> => {
    await api.post("/users/me/password-change/confirm", payload);
  },

  // Watch History
  getWatchHistory: async (page = 1, limit = 20): Promise<PageResponse<WatchHistoryDto>> => {
    const { data } = await api.get<ApiResponse<PageResponse<WatchHistoryDto>>>("/users/me/watch-history", {
      params: { page, limit }
    });
    return data.data;
  },

  updateWatchProgress: async (payload: { episodeId: number; progressSeconds: number; isCompleted: boolean }): Promise<void> => {
    await api.post("/users/me/watch-history", payload);
  },

  getAnimeWatchHistory: async (animeId: number): Promise<any> => {
    const { data } = await api.get<ApiResponse<any>>(`/users/me/watch-history/anime/${animeId}`);
    return data.data;
  },

  clearWatchHistory: async (): Promise<void> => {
    await api.delete("/users/me/watch-history");
  },

  clearWatchHistoryByAnimeId: async (episodeId: number): Promise<void> => {
    await api.delete(`/users/me/watch-history/${episodeId}`);
  },

  // Bookmarks
  getBookmarks: async (page = 1, limit = 20): Promise<PageResponse<BookmarkDto>> => {
    const { data } = await api.get<ApiResponse<PageResponse<BookmarkDto>>>("/users/me/bookmarks", {
      params: { page, limit }
    });
    return data.data;
  },

  getBookmarkStatus: async (animeId: number): Promise<boolean> => {
    const { data } = await api.get<ApiResponse<{ bookmarked: boolean }>>(`/users/me/bookmarks/${animeId}/status`);
    return data.data.bookmarked;
  },

  addBookmark: async (animeId: number): Promise<void> => {
    await api.post(`/users/me/bookmarks/${animeId}`);
  },

  removeBookmark: async (animeId: number): Promise<void> => {
    await api.delete(`/users/me/bookmarks/${animeId}`);
  },

  // Ratings
  getRatingSummary: async (animeId: number): Promise<RatingSummaryDto> => {
    const { data } = await api.get<ApiResponse<RatingSummaryDto>>(`/ratings/anime/${animeId}/summary`);
    return data.data;
  },

  getMyRating: async (animeId: number): Promise<number> => {
    const { data } = await api.get<ApiResponse<{ score: number }>>(`/ratings/anime/${animeId}/me`);
    return data.data.score || 0;
  },

  rateAnime: async (animeId: number, score: number): Promise<void> => {
    await api.post(`/ratings/anime/${animeId}`, { score });
  }
};
