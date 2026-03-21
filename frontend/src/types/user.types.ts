export interface UserDto {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: "USER" | "ADMIN";
  provider: "LOCAL" | "GOOGLE";
  emailVerified: boolean;
  isVip?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface UserStatsDto {
  totalWatched: number;
  totalBookmarks: number;
}

export interface UserProfileDto extends UserDto {
  stats: UserStatsDto;
}

export interface WatchHistoryDto {
  animeId: number;
  animeTitle: string;
  animeSlug: string;
  thumbnail: string;
  lastEpisodeId: number;
  lastEpisodeNumber: number;
  lastEpisodeTitle: string;
  durationSeconds: number;
  progressSeconds: number;
  watchedAt: string;
  isCompleted: boolean;
}

export interface BookmarkDto {
  animeId: number;
  animeTitle: string;
  slug: string;
  thumbnail: string;
  averageScore: number;
  status: "ONGOING" | "COMPLETED" | "UPCOMING";
  type: string;
  totalEpisodes: number;
  year: number;
  hasVipContent: boolean;
  bookmarkedAt: string;
}

export interface RatingSummaryDto {
  averageScore: number;
  totalRatings: number;
  distribution: Record<number, number>;
}

export interface UpdateProfileRequest {
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ConfirmChangePasswordRequest {
  otpCode: string;
}
