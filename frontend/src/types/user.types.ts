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
