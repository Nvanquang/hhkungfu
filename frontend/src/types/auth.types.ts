import type { UserDto } from "./user.types";

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  expiresIn: number; // seconds until access token expires
  message?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean; // forwarded to backend to control refresh-token cookie TTL
}

export interface RegisterRequest {
  email: string;
  username: string;
  password?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword?: string;
}

/** Shape of a decoded JWT payload (subset the client cares about) */
export interface JWTPayload {
  sub: string;          // user id (subject)
  email?: string;
  roles?: string[];
  permissions?: string[];
  exp: number;          // Unix timestamp in seconds
  iat: number;          // issued-at Unix timestamp in seconds
}

/** Auth user stored in Zustand — identical to UserDto for now */
export type AuthUser = UserDto;
