/**
 * Auth service — pure HTTP functions. No store imports. No side effects.
 *
 * All state management is the caller's responsibility
 * (useAuthInit, login page, apiClient interceptor).
 */
import { api } from "./apiClient";
import type {
  ApiResponse,
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "@/types/index";

export const authService = {
  // ── Core auth ──────────────────────────────────────────────────────────────

  /**
   * POST /auth/login
   * Returns the full auth payload: user + accessToken + expiresIn.
   * rememberMe controls the backend's refresh-token cookie TTL.
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );
    return data.data;
  },

  /**
   * POST /auth/logout
   * Asks the backend to invalidate the HttpOnly refresh-token cookie.
   */
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  /**
   * POST /auth/refresh
   * The browser automatically sends the HttpOnly refresh-token cookie.
   * Returns the new access token string (not the full payload).
   *
   * NOTE: The apiClient interceptor also calls /auth/refresh directly via
   * a raw axios instance to avoid interceptor loops. This method exists
   * for callers outside the interceptor (e.g. useAuthInit proactive refresh).
   */
  refreshToken: async (): Promise<string> => {
    const { data } = await api.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh"
    );
    const token = data?.data?.accessToken;
    if (!token) throw new Error("Invalid refresh response: missing accessToken");
    return token;
  },

  /**
   * GET /auth/me
   * Returns the currently authenticated user's profile.
   */
  getCurrentUser: async (): Promise<AuthUser> => {
    const { data } = await api.get<ApiResponse<AuthUser>>("/auth/me");
    return data.data;
  },

  // ── Registration & email verification ──────────────────────────────────────

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      payload
    );
    return data.data;
  },

  verifyEmail: async (
    payload: VerifyOtpRequest
  ): Promise<{ message: string }> => {
    const { data } = await api.post<ApiResponse<{ message: string }>>(
      "/auth/verify-email",
      payload
    );
    return data.data;
  },

  resendVerification: async (
    email: string
  ): Promise<{ message: string }> => {
    const { data } = await api.post<ApiResponse<{ message: string }>>(
      "/auth/resend-verification",
      { email }
    );
    return data.data;
  },

  // ── Password management ────────────────────────────────────────────────────

  forgotPassword: async (
    payload: ForgotPasswordRequest
  ): Promise<{ message: string }> => {
    const { data } = await api.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      payload
    );
    return { message: data.message ?? "" };
  },

  resetPassword: async (
    payload: ResetPasswordRequest
  ): Promise<{ message: string }> => {
    const { data } = await api.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      payload
    );
    return { message: data.message ?? "" };
  },
};
