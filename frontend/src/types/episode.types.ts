export type VideoStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface SubtitleEntry {
  language: string;   // 'vi' | 'en'
  label: string;      // 'Vietsub' | 'Engsub'
  url: string;        // .vtt file URL
}

export interface EpisodeItem {
  id: number;
  animeId: number;
  episodeNumber: number;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  isVipOnly: boolean;
  videoStatus: VideoStatus;
  hlsBaseUrl: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  hasVietsub: boolean;
  hasEngsub: boolean;
  viewCount: number;
  airedDate: string | null;
  createdAt: string;
  updatedAt: string;
  subtitles?: SubtitleEntry[];
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

export interface CreateEpisodeRequest {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  isVipOnly?: boolean;
  hasVietsub?: boolean;
  hasEngsub?: boolean;
  airedDate?: string;
}

export type UpdateEpisodeRequest = Partial<CreateEpisodeRequest>;

// Enum này khớp với TranscodeJobStatus.java
export type TranscodeJobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export interface TranscodeJob {
  jobId: number;
  status: TranscodeJobStatus;
  progress: number;       // 0–100
  currentStep: string | null;
  masterUrl: string | null;
  error: string | null;
}

