// Các hằng số dùng cho VideoUpload module

export const QUALITY_OPTIONS = [
  { value: "360p", label: "360p", required: true, description: "Bắt buộc" },
  { value: "720p", label: "720p", required: false, description: "Khuyến nghị" }
] as const;

export type QualityOption = (typeof QUALITY_OPTIONS)[number]["value"];

export const MAX_FILE_SIZE_GB = 2;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
  "video/mp4",
  "video/x-matroska",
  "video/x-msvideo",
];

export const ACCEPTED_EXTENSIONS = ".mp4,.mkv,.avi";

export const UPLOAD_NOTES = [
  "Transcode có thể mất 5–15 phút tùy độ dài video.",
  "File gốc sẽ tự động xóa sau khi encode xong.",
  "Không đóng hoặc tắt tab này khi đang upload.",
];
