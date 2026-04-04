import { api } from "@/services/apiClient";
import type { ApiResponse, PageResponse } from "@/types/api.types";
import type {
    EpisodeItem,
    EpisodeQueryParams,
    CreateEpisodeRequest,
    TranscodeJob,
} from "@/types/episode.types";
import type { StreamInfo, WatchProgressPayload } from "@/types/video.types";

export const watchService = {
    // ── EPISODES ────────────────────────────────────────────────────────────
    getEpisodes: async (animeId: number, params?: EpisodeQueryParams): Promise<PageResponse<EpisodeItem>> => {
        const { data } = await api.get<ApiResponse<PageResponse<EpisodeItem>>>(`/animes/${animeId}/episodes`, { params });
        return data.data;
    },

    getEpisodeByNumber: async (animeId: number, episodeNumber: number): Promise<EpisodeItem> => {
        const { data } = await api.get<ApiResponse<EpisodeItem>>(`/animes/${animeId}/episodes/${episodeNumber}`);
        return data.data;
    },

    createEpisode: async (animeId: number, payload: CreateEpisodeRequest): Promise<EpisodeItem> => {
        // Backend: @PostMapping("/animes/{animeId}/episodes") in EpisodeController
        const { data } = await api.post<ApiResponse<EpisodeItem>>(`/animes/${animeId}/episodes`, payload);
        return data.data;
    },

    deleteEpisode: async (episodeId: number): Promise<void> => {
        // Backend: @DeleteMapping("/episodes/{id}") in EpisodeController
        await api.delete(`/episodes/${episodeId}`);
    },

    // ── STREAM & VIDEO ───────────────────────────────────────────────────────
    getStreamInfo: async (episodeId: number): Promise<StreamInfo> => {
        const { data } = await api.get<ApiResponse<StreamInfo>>(`/episodes/${episodeId}/stream-info`);
        return data.data;
    },

    // ── TRANSCODE & UPLOAD ───────────────────────────────────────────────────
    getTranscodeHistory: async (episodeId: number): Promise<TranscodeJob[]> => {
        // Backend: @GetMapping("/episodes/{episodeId}/transcode-history") in VideoProgressController (Admin)
        const { data } = await api.get<ApiResponse<TranscodeJob[]>>(`/admin/episodes/${episodeId}/transcode-history`);
        return data.data ?? [];
    },

    uploadVideo: async (episodeId: number, file: File, onProgress?: (p: number) => void): Promise<{ jobId: number }> => {
        const formData = new FormData();
        formData.append("file", file);

        const { data } = await api.post<ApiResponse<{ jobId: number }>>(
            `/admin/episodes/${episodeId}/upload`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 1));
                    onProgress?.(progress);
                },
            }
        );
        return data.data;
    },

    getJobStatus: async (jobId: number): Promise<TranscodeJob> => {
        // Backend: @GetMapping("/transcode/{jobId}") in VideoProgressController (Admin)
        const { data } = await api.get<ApiResponse<TranscodeJob>>(`/admin/transcode/${jobId}`);
        return data.data;
    },



    // ── VIEW COUNT & PROGRESS ────────────────────────────────────────────────
    recordView: async (episodeId: number): Promise<void> => {
        await api.post(`/episodes/${episodeId}/view`);
    },

    saveProgress: async (payload: WatchProgressPayload): Promise<void> => {
        await api.post("/users/me/watch-history", payload);
    },
};

