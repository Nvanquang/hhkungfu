import type { AnimeStatus, AnimeType, AnimeSeason, AgeRating } from "@/types/anime.types";

export const STATUSES: { value: AnimeStatus; label: string }[] = [
  { value: "ONGOING", label: "Đang chiếu" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "UPCOMING", label: "Sắp ra mắt" },
];

export const TYPES: { value: AnimeType; label: string }[] = [
  { value: "TV", label: "TV Series" },
  { value: "MOVIE", label: "Movie" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Special" },
];

export const SEASONS: { value: AnimeSeason; label: string }[] = [
  { value: "WINTER", label: "Đông (Winter)" },
  { value: "SPRING", label: "Xuân (Spring)" },
  { value: "SUMMER", label: "Hè (Summer)" },
  { value: "FALL", label: "Thu (Fall)" },
];

export const AGE_RATINGS: { value: AgeRating; label: string }[] = [
  { value: "G", label: "G – Mọi lứa tuổi" },
  { value: "PG", label: "PG – Hướng dẫn phụ huynh" },
  { value: "PG_13", label: "PG-13 – Từ 13 tuổi" },
  { value: "R", label: "R – Hạn chế" },
  { value: "R_PLUS", label: "R+ – Nội dung người lớn nhẹ" },
];
