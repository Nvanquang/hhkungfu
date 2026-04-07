import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import {
  isRefreshing,
  setRefreshing,
  processQueue,
  enqueue,
} from "./refreshQueue";
import { scheduleRefresh } from "./tokenService";

/**
 * Perform a silent refresh by exchanging the HttpOnly cookie for a new JWT.
 * Updates the store, schedules the next proactive refresh, and syncs WebSockets.
 *
 * This function handles its own errors by logging out the user if the refresh
 * token is invalid/expired.
 */
export async function triggerSilentRefresh(): Promise<string> {
  try {
    // 1. Exchange cookie for new token using raw axios to bypass interceptors
    const response = await axios.post<{ data: { accessToken: string } }>(
      `${api.defaults.baseURL}/auth/refresh`,
      undefined,
      { withCredentials: true }
    );

    const newToken = response.data?.data?.accessToken;
    if (!newToken) throw new Error("Missing token in refresh response");

    // 2. Update memory state
    useAuthStore.getState().setToken(newToken);

    // 3. Schedule the NEXT proactive refresh (recursively)
    scheduleRefresh(newToken, () => {
      void triggerSilentRefresh();
    });

    // 4. Hot-swap WebSocket token
    const { webSocketService } = await import("./websocketService");
    webSocketService.reconnectOnTokenRefresh(newToken);

    return newToken;
  } catch (error) {
    // If refresh fails, the session is dead. Clean up and notify user.
    const { webSocketService } = await import("./websocketService");
    webSocketService.disconnectAndClear();
    useAuthStore.getState().clearAuth();

    // Only notify if we were previously logged in (to avoid spamming guests)
    if (useAuthStore.getState().isAuthenticated) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    throw error;
  }
}

// ── URLs that must bypass the 401-refresh retry ────────────────────────────
const SKIP_REFRESH_URLS = ["/auth/refresh", "/auth/login"];

// ── Axios instance ─────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // auto-send HttpOnly refresh-token cookie
});

// ── Request interceptor ────────────────────────────────────────────────────
// Sole responsibility: inject the Bearer token from Zustand.
// Never check expiry here — that causes premature logout and breaks
// the refresh flow. Expiry is handled reactively through 401 responses.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;
    const errData = error.response?.data as Record<string, unknown> | undefined;
    const url = originalRequest?.url ?? "";

    // ── Error toast ──────────────────────────────────────────────────────
    // Suppress toasts for:
    //   • background auth probing (/auth/me, /auth/refresh)
    //   • all 401s (handled silently by the refresh flow below)
    const isSilentUrl =
      SKIP_REFRESH_URLS.some((u) => url.includes(u)) ||
      url.includes("/auth/me");
    const shouldShowToast = !isSilentUrl && status !== 401;

    if (shouldShowToast && status && status >= 400) {
      const errObj = errData?.error;
      let message = "Đã xảy ra lỗi. Vui lòng thử lại.";

      if (typeof errObj === "string") {
        message = errObj;
      } else if (
        errObj &&
        typeof errObj === "object" &&
        "message" in errObj &&
        typeof (errObj as { message?: unknown }).message === "string"
      ) {
        message = String((errObj as { message: string }).message);
      } else if (errData?.message && typeof errData.message === "string") {
        message = errData.message;
      }

      toast.error(message);
    }

    // ── 401 silent refresh flow ──────────────────────────────────────────
    const shouldAttemptRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !SKIP_REFRESH_URLS.some((u) => url.includes(u));

    if (!shouldAttemptRefresh) {
      return Promise.reject(error);
    }

    // If refresh is already in-flight, queue this request and wait
    if (isRefreshing) {
      return enqueue().then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    // First 401 — start the refresh cycle
    originalRequest._retry = true;
    setRefreshing(true);

    try {
      const newToken = await triggerSilentRefresh();

      // Resolve all queued requests with the new token
      processQueue(null, newToken);

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed (handled by triggerSilentRefresh, but we must clear the queue)
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      setRefreshing(false);
    }
  }
);

