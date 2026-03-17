import type { UserDto } from "./user.types";

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  expiresIn: number;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
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
