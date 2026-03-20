export type AnimeStatus = 'ONGOING' | 'COMPLETED' | 'UPCOMING';
export type AnimeType = 'TV' | 'MOVIE' | 'OVA' | 'SPECIAL' | 'ONA';
export type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
export type AgeRating = 'G' | 'PG' | 'PG-13' | 'R' | 'R+';

export interface Genre {
  id: number;
  name: string | null;
  nameVi?: string | null;
  slug: string | null;
}

export interface Studio {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface AnimeSummary {
  id: number;
  title: string | null;
  titleVi: string | null;
  slug: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  status: AnimeStatus;
  type: AnimeType;
  totalEpisodes: number | null;
  year: number | null;
  malScore: number | null;
  viewCount: number;
  hasVipContent: boolean;
  genres: Genre[];
  // Present in `/animes/recently-updated`
  latestEp?: number;
  latestEpAdded?: string;
}

export interface AnimeDetail extends AnimeSummary {
  titleOther: string[];
  description: string | null;
  episodeDuration: number | null;
  airedFrom: string | null;
  airedTo: string | null;
  season: AnimeSeason | null;
  ageRating: AgeRating | null;
  isFeatured: boolean;
  studios: Studio[];
  averageRating: number | null;
  totalRatings: number;
  createdAt: string;
}

export interface AnimeQueryParams {
  key?: string | null;
  page?: number;
  limit?: number;
  sort?: 'viewCount' | 'malScore' | 'createdAt' | 'year';
  order?: 'asc' | 'desc';
  status?: AnimeStatus;
  type?: AnimeType;
  year?: number;
  season?: AnimeSeason;
  genre?: string | null;
  studioId?: number;
}
