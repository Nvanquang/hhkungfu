export interface VideoQuality {
  quality: string; // '360p' | '720p'
  url: string;
}

export interface VideoSubtitle {
  language: string; // 'vi' | 'en' | 'ja'
  label: string;    // 'Vietsub' | 'Engsub'
  url: string;      // .vtt file URL
}

export interface StreamInfo {
  episodeId: number | null;
  videoStatus: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  masterUrl: string | null;
  qualities: VideoQuality[] | null;
  subtitles: VideoSubtitle[] | null;
  durationSeconds: number | null;
}

export interface TranscodeProgress {
  jobId: number;
  status: 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
  progress: number;    // 0-100
  currentStep: string;
  masterUrl?: string;  // present when DONE
  error?: string;      // present when FAILED
}

export interface WatchProgressPayload {
  episodeId: number;
  progressSeconds: number;
  isCompleted: boolean;
}
