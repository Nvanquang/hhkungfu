// Khai báo các giá trị hợp lệ gửi lên BE (tiếng Anh) và label hiển thị UI (tiếng Việt).
// Dùng chung cho desktop filter bar, mobile dialog, và URL param parsing.
import type { AnimeStatus, AnimeType } from "@/types/anime.types";

export const STATUS_OPTIONS = ["ONGOING", "COMPLETED", "UPCOMING"] as const satisfies readonly AnimeStatus[];
export const TYPE_OPTIONS   = ["TV", "MOVIE", "OVA", "SPECIAL", "ONA"] as const satisfies readonly AnimeType[];
export const SORT_OPTIONS   = ["viewCount", "malScore", "createdAt", "year"] as const;
export const ORDER_OPTIONS  = ["desc", "asc"] as const;

export type SortOption  = (typeof SORT_OPTIONS)[number];
export type OrderOption = (typeof ORDER_OPTIONS)[number];

// ── Label tiếng Việt — dùng khi render UI, KHÔNG gửi lên BE ─────────────────

export const STATUS_LABEL: Record<(typeof STATUS_OPTIONS)[number], string> = {
  ONGOING:   "Đang chiếu",
  COMPLETED: "Hoàn thành",
  UPCOMING:  "Sắp ra mắt",
};

export const TYPE_LABEL: Record<(typeof TYPE_OPTIONS)[number], string> = {
  TV:      "TV Series",
  MOVIE:   "Phim lẻ",
  OVA:     "OVA",
  SPECIAL: "Special",
  ONA:     "ONA",
};

export const SORT_LABEL: Record<SortOption, string> = {
  viewCount: "Phổ biến nhất",
  malScore:  "Điểm cao nhất",
  createdAt: "Mới nhất",
  year:      "Năm phát hành",
};

export const ORDER_LABEL: Record<OrderOption, string> = {
  desc: "Giảm dần",
  asc:  "Tăng dần",
};