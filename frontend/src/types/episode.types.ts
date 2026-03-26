export type VideoStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface EpisodeItem {
  id: number;
  animeId: number;
  episodeNumber: number;
  title: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  videoStatus: VideoStatus;
  isVipOnly: boolean;
  hasVietsub: boolean;
  hasEngsub: boolean;
  viewCount: number;
  airedDate: string | null;
  description?: string | null;
}

export interface EpisodeListResponse {
  items: EpisodeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EpisodeQueryParams {
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}
