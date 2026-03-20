import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Send HttpOnly cookies automatically
});

// Request queueing mechanism for concurrent 401s
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// Request interceptor: connect JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Return response directly without automatic success notification
api.interceptors.response.use(
  (res) => {
    return res;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const errData: unknown = error.response?.data;

    // Do not show error toast for background auth requests or 401 Unauthorized (except login)
    // 401s are handled silently by the token refresh flow
    let shouldShowToast = true;
    if (originalRequest?.url?.includes("/auth/me") || originalRequest?.url?.includes("/auth/refresh")) {
      shouldShowToast = false;
    }
    if (error.response?.status === 401 && !originalRequest?.url?.includes("/auth/login")) {
      shouldShowToast = false;
    }

    if (shouldShowToast) {
      // Show error toast when BE returns ErrorResponse (success, error, timestamp)
      if (errData && typeof errData === "object" && Object.prototype.hasOwnProperty.call(errData, "error")) {
        const e = (errData as { error?: unknown }).error;
        const message =
          typeof e === "string"
            ? e
            : e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string"
              ? String((e as { message?: unknown }).message)
              : e && typeof e === "object" && "code" in e
                ? String((e as { code?: unknown }).code)
                : "Đã xảy ra lỗi. Vui lòng thử lại.";
        toast.error(message);
      } else if (error.response?.status && error.response.status >= 400) {
        toast.error(error.response?.statusText || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    }

    // 401: try refresh token
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        // Enqueue concurrent requests
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          undefined, // No body needs to be sent
          { withCredentials: true } // Ensure cookies are sent
        );

        const payload: unknown = res.data;
        if (payload && typeof payload === "object" && (payload as { success?: unknown }).success && "data" in payload) {
          const data = (payload as { data?: unknown }).data;
          const accessToken = data && typeof data === "object" && "accessToken" in data ? (data as { accessToken?: unknown }).accessToken : null;
          if (typeof accessToken !== "string") throw new Error("Invalid refresh token response");
          // Update zustand store
          useAuthStore.getState().setToken(accessToken);

          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
        throw new Error("Invalid refresh credentials");
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        // Option to redirect to login, but we rely on ProtectedRoute usually. Redirecting could be aggressive if you have public routes doing 401s.
        // window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
