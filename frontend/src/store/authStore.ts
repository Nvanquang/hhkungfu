import { create } from "zustand";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────
  user: AuthUser | null;
  /** Access token lives ONLY in memory — never in localStorage/sessionStorage */
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True while the initial bootstrap (refresh → /me) is running */
  isBootstrapping: boolean;
  /** Derived from user.role; expands naturally when backend sends roles[] */
  roles: string[];
  permissions: string[];

  // ── Actions ────────────────────────────────────────────────────────────────
  setToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setBootstrapping: (value: boolean) => void;
  /** Full reset — called on logout or bootstrap failure */
  clearAuth: () => void;
  /** Shallow-merge a partial user (e.g. after profile update) */
  updateUser: (data: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // BroadcastChannel: sync logout signal across browser tabs.
  // NOTE: this listener clears LOCAL Zustand state only.
  // React Query cache is cleared by the channel handler in useAuthInit.
  const authChannel = new BroadcastChannel("auth");

  authChannel.onmessage = (event: MessageEvent<string>) => {
    if (event.data === "logout") {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        roles: [],
        permissions: [],
      });
    }
    // "login" events from other tabs are intentionally ignored —
    // each tab bootstraps independently via its HttpOnly cookie.
  };

  return {
    // initial state — isBootstrapping starts true so ProtectedRoute/AuthGuard
    // renders a spinner immediately without a flash of "not authenticated"
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isBootstrapping: true,
    roles: [],
    permissions: [],

    setToken: (token) => set({ accessToken: token }),

    setUser: (user) =>
      set({
        user,
        isAuthenticated: true,
        // Derive roles from UserDto.role (single string today).
        // Extend here if the backend starts sending a roles[] array.
        roles: [user.role],
        permissions: [],
      }),

    setBootstrapping: (value) => set({ isBootstrapping: value }),

    clearAuth: () => {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        roles: [],
        permissions: [],
      });
      // Broadcast logout to all other tabs
      authChannel.postMessage("logout");
    },

    updateUser: (data) => {
      const current = get().user;
      if (current) {
        const updated = { ...current, ...data };
        set({ user: updated, roles: [updated.role] });
      }
    },
  };
});
