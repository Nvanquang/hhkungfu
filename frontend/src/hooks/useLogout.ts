import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { clearRefreshTimer } from "@/services/tokenService";
import { webSocketService } from "@/services/websocketService";

/**
 * useLogout — encapsulates the full logout flow:
 *   1. POST /auth/logout (tells backend to invalidate the refresh-token cookie)
 *   2. Disconnect WebSocket
 *   3. Cancel proactive refresh timer
 *   4. Clear React Query cache
 *   5. clearAuth() in Zustand (broadcasts "logout" to other tabs)
 *
 * The API call is attempted but failures are intentionally swallowed —
 * client-side state is cleared regardless.
 */
export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    // Best-effort: tell the backend to revoke the refresh-token cookie
    try {
      await authService.logout();
    } catch {
      // Swallow — we still clear local state even if the API call fails
    }

    // Disconnect WebSocket immediately
    webSocketService.disconnectAndClear();

    // Cancel any scheduled proactive token refresh
    clearRefreshTimer();

    // Nuke the React Query cache so no stale data leaks to the next session
    queryClient.clear();

    // Reset Zustand state + broadcast "logout" to other tabs via BroadcastChannel
    clearAuth();
  }, [clearAuth, queryClient]);
}
