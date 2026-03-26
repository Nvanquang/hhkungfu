import { api } from "@/services/apiClient";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type { EpisodeItem, EpisodeQueryParams } from "@/types/episode.types";
import type { StreamInfo, WatchProgressPayload } from "@/types/video.types";

export const watchService = {
    // EPISODES
    getEpisodes: async (animeId: number, params?: EpisodeQueryParams): Promise<PageResponse<EpisodeItem>> => {
        const { data } = await api.get<ApiResponse<PageResponse<EpisodeItem>>>(`/animes/${animeId}/episodes`, { params });
        return data.data;
    },

    getEpisodeByNumber: async (animeId: number, episodeNumber: number): Promise<EpisodeItem> => {
        const { data } = await api.get<ApiResponse<EpisodeItem>>(`/animes/${animeId}/episodes/${episodeNumber}`);
        return data.data;
    },

    // STREAM & VIDEO
    getStreamInfo: async (episodeId: number): Promise<StreamInfo> => {
        const { data } = await api.get<ApiResponse<StreamInfo>>(`/episodes/${episodeId}/stream-info`);
        return data.data;
    },

    // VIEW COUNT & PROGRESS
    recordView: async (episodeId: number): Promise<void> => {
        await api.post(`/episodes/${episodeId}/view`);
    },

    saveProgress: async (payload: WatchProgressPayload): Promise<void> => {
        await api.post("/users/me/watch-history", payload);
    },
};
