import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { scheduleRefresh, clearRefreshTimer } from "@/services/tokenService";
import { webSocketService } from "@/services/websocketService";
import { triggerSilentRefresh } from "@/services/apiClient";

/**
 * useAuthInit — bootstraps authentication on app mount (call once in App.tsx).
 *
 * Bootstrap flow:
 *   1. setBootstrapping(true)          — AuthGuard shows spinner
 *   2. POST /auth/refresh              — exchange HttpOnly cookie for access token
 *   3. On success:
 *        a. setToken(accessToken)      — store token in memory (Zustand)
 *        b. GET /auth/me              — load user profile
 *        c. setUser(user)             — isAuthenticated = true
 *        d. scheduleRefresh(...)      — proactive silent refresh 60s before expiry
 *        e. connectWithToken(token)   — open WebSocket with auth token
 *   4. On failure:
 *        clearAuth()                  — no redirect; AuthGuard redirects naturally
 *   5. finally: setBootstrapping(false)
 *
 * Also listens on BroadcastChannel("auth") for logout events from other tabs
 * so React Query cache is cleared in this tab too.
 */
export const useAuthInit = () => {
  const { setToken, setUser, setBootstrapping, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation (dev only)
    if (initialized.current) return;
    initialized.current = true;

    // ── Cross-tab logout synchronisation ────────────────────────────────────
    // authStore's own BroadcastChannel listener handles the Zustand state reset.
    // This handler takes care of side-effects that are not store-level:
    // React Query cache and WebSocket disconnection.
    const authChannel = new BroadcastChannel("auth");
    authChannel.onmessage = (event: MessageEvent<string>) => {
      if (event.data === "logout") {
        queryClient.clear();
        clearRefreshTimer();
        webSocketService.disconnectAndClear();
      }
    };

    // ── Bootstrap ────────────────────────────────────────────────────────────
    const bootstrap = async () => {
      setBootstrapping(true);

      try {
        // Step 1 — Exchange the HttpOnly refresh-token cookie for an access token.
        //           This is the correct entry point: it works whether or not
        //           the user has an existing access token in memory.
        const accessToken = await authService.refreshToken();

        // Step 2 — Persist the new token in Zustand (memory only)
        setToken(accessToken);

        // Step 3 — Fetch the authenticated user's profile
        const user = await authService.getCurrentUser();

        // Step 4 — Update store: sets isAuthenticated = true, roles, permissions
        setUser(user);

        // Step 5 — Schedule a proactive silent refresh before the token expires
        scheduleRefresh(accessToken, () => {
          void triggerSilentRefresh();
        });

        // Step 6 — Open WebSocket with the authenticated token
        //           (only AFTER bootstrap is complete)
        webSocketService.connectWithToken(accessToken);
      } catch {
        // Bootstrap failed: no valid refresh-token cookie exists.
        // Do NOT redirect here — AuthGuard / ProtectedRoute handles navigation.
        clearAuth();
        // Ensure React Query has no stale data from a previous session
        queryClient.clear();
        clearRefreshTimer();
      } finally {
        // Always mark bootstrapping as done so AuthGuard stops spinning
        setBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      authChannel.close();
    };
  }, []); // empty deps — intentional; runs exactly once on mount
};
