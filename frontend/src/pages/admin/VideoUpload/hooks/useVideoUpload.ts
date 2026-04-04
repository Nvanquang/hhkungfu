import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { watchService } from "@/services/watchService";
import { MAX_FILE_SIZE_BYTES, ACCEPTED_MIME_TYPES } from "../video-upload.constants";
import type { QualityOption } from "../video-upload.constants";

export type UploadPhase = "idle" | "uploading" | "transcoding" | "done" | "failed";

export interface UploadState {
  phase: UploadPhase;
  file: File | null;
  uploadProgress: number;   // 0–100
  jobId: number | null;
  error: string | null;
}

export function useVideoUpload(episodeId: number) {
  const queryClient = useQueryClient();

  const [state, setState] = useState<UploadState>({
    phase: "idle",
    file: null,
    uploadProgress: 0,
    jobId: null,
    error: null,
  });

  const [selectedQualities, setSelectedQualities] = useState<QualityOption[]>(["360p", "720p"]);



  // ── 2. Job Status Polling ──────────────────────────────────────────────────
  const { data: currentJob } = useQuery({
    queryKey: ["admin", "job", state.jobId],
    queryFn: () => watchService.getJobStatus(state.jobId!),
    enabled: !!state.jobId && (state.phase === "transcoding" || state.phase === "uploading"),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "DONE" || status === "FAILED") return false;
      return 3000;
    },
  });

  // ── Sync Phase from Job Status ───────────────────────────────────────────
  useEffect(() => {
    if (!currentJob) return;

    if (currentJob.status === "DONE") {
      setState((prev) => ({ ...prev, phase: "done" }));
      queryClient.invalidateQueries({ queryKey: ["admin", "episodes"] });
    } else if (currentJob.status === "FAILED") {
      setState((prev) => ({ ...prev, phase: "failed", error: currentJob.error }));
    } else if (currentJob.status === "PROCESSING" || currentJob.status === "PENDING") {
      if (state.phase === "uploading" && state.uploadProgress === 100) {
        setState((prev) => ({ ...prev, phase: "transcoding" }));
      }
    }
  }, [currentJob, episodeId, queryClient, state.phase, state.uploadProgress]);

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mkv|avi)$/i)) {
      toast.error("Định dạng file không hợp lệ. Chỉ chấp nhận MP4, MKV, AVI.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File quá lớn. Tối đa 2 GB.");
      return;
    }

    setState({
      phase: "idle",
      file,
      uploadProgress: 0,
      jobId: null,
      error: null,
    });
  }, []);

  // ── Toggle quality ─────────────────────────────────────────────────────────
  const toggleQuality = useCallback((q: QualityOption) => {
    if (q === "360p") return;
    setSelectedQualities((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q],
    );
  }, []);

  // ── Start actual upload ────────────────────────────────────────────────────
  const startUpload = useCallback(async () => {
    if (!state.file) {
      toast.error("Chưa chọn file video.");
      return;
    }

    try {
      setState((s) => ({ ...s, phase: "uploading", uploadProgress: 0, error: null }));

      const { jobId } = await watchService.uploadVideo(
        episodeId,
        state.file,
        (progress) => {
          setState((s) => ({ ...s, uploadProgress: progress }));
        }
      );

      setState((s) => ({ ...s, jobId, uploadProgress: 100 }));
      toast.info("Upload hoàn tất, đang chờ transcode...");
    } catch (err: any) {
      console.error("Upload error:", err);
      setState((s) => ({
        ...s,
        phase: "failed",
        error: err.response?.data?.message || "Lỗi khi upload video."
      }));
      toast.error("Upload thất bại.");
    }
  }, [state.file, episodeId]);

  // ── Cancel/Retry ───────────────────────────────────────────────────────────
  const cancelUpload = useCallback(() => {
    // Axios cancel is harder to implement inside watchService without passing token
    // For now, we refresh
    window.location.reload();
  }, []);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, phase: "idle", uploadProgress: 0, jobId: null, error: null }));
  }, []);

  return {
    state,
    streamInfo: currentJob ? { 
      videoStatus: currentJob.status as any, 
      progress: currentJob.progress,
      durationSeconds: null,
      hlsPath: null,
      hlsBaseUrl: null
    } : null,
    selectedQualities,
    handleFileChange,
    toggleQuality,
    startUpload,
    cancelUpload,
    retry,
  };
}

