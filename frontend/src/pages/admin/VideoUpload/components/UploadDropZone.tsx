import { useRef, useState } from "react";
import { Upload, FileVideo } from "lucide-react";
import { MAX_FILE_SIZE_GB, ACCEPTED_EXTENSIONS } from "../video-upload.constants";
import type { UploadState } from "../hooks/useVideoUpload";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface Props {
  uploadState: UploadState;
  onFileChange: (file: File | null) => void;
  onStart: () => void;
  onCancel: () => void;
}

export function UploadDropZone({ uploadState, onFileChange, onStart, onCancel }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { phase, file, uploadProgress } = uploadState;
  const isUploading = phase === "uploading";
  const canStart = phase === "idle" && !!file;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFileChange(droppedFile);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3
          rounded-xl border-2 border-dashed p-6 text-center transition-all
          ${isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
          }
          ${isUploading ? "pointer-events-none opacity-70" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="sr-only"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          disabled={isUploading}
        />

        {file ? (
          <>
            <FileVideo className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
            </div>
            {!isUploading && (
              <p className="text-xs text-slate-400">Nhấn để chọn file khác</p>
            )}
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">Kéo thả file video vào đây</p>
              <p className="text-xs text-slate-400 mt-1">hoặc nhấn để chọn file</p>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        MP4 / MKV / AVI · tối đa {MAX_FILE_SIZE_GB} GB
      </p>

      {/* Upload progress */}
      {(isUploading || (file && phase === "idle")) && file && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <FileVideo className="h-5 w-5 shrink-0 text-blue-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
            </div>
          </div>

          {isUploading && (
            <>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Đang upload… {Math.round(uploadProgress)}%</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {isUploading ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Hủy upload
          </button>
        ) : (
          <>
            {phase === "idle" && file && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
            )}
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="mr-2 h-4 w-4" />
              Bắt đầu Upload
            </button>
          </>
        )}
      </div>
    </div>
  );
}
