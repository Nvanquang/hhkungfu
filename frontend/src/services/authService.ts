import { api } from "./apiClient";
import { useAuthStore } from "@/store/authStore";
import type {
  ApiResponse,
  UserDto,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from "@/types/index";

export const authService = {
  login: async (payload: LoginRequest): Promise<{ data: AuthResponse; message: string }> => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    return { data: response.data.data, message: response.data.message || "" };
  },

  register: async (payload: RegisterRequest): Promise<{ data: AuthResponse; message: string }> => {
    const response = await api.post<ApiResponse<AuthResponse>>("/auth/register", payload);
    return { data: response.data.data, message: response.data.message || "" };
  },

  verifyEmail: async (payload: VerifyOtpRequest): Promise<{ message: string }> => {
    const { data } = await api.post<ApiResponse<{ message: string }>>("/auth/verify-email", payload);
    return data.data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<ApiResponse<{ message: string }>>("/auth/resend-verification", { email });
    return data.data;
  },

  logout: async (): Promise<{ message: string }> => {
    useAuthStore.getState().logout();
    const { data } = await api.post<ApiResponse<{ message: string }>>("/auth/logout");
    return data.data;
  },

  getMe: async (): Promise<UserDto> => {
    const { data } = await api.get<ApiResponse<UserDto>>("/auth/me");
    return data.data;
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>("/auth/forgot-password", payload);
    return { message: response.data.message || "" };
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>("/auth/reset-password", payload);
    return { message: response.data.message || "" };
  }
};
