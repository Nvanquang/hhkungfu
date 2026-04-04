export type Range = "today" | "week" | "month";

export const RANGES = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "7 ngày" },
  { value: "month", label: "30 ngày" },
] as const;

export const CHART_COLORS = {
  views: "#2563eb", // blue-600
  revenue: "#16a34a", // green-600
};
