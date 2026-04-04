export const GENRE_STUDIO_TABS = {
  GENRE: "genre",
  STUDIO: "studio",
} as const;

export type TabValue = typeof GENRE_STUDIO_TABS[keyof typeof GENRE_STUDIO_TABS];
