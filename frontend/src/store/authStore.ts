import { create } from "zustand";

import type { UserDto } from "@/types/user.types";

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  setAuth: (user: UserDto, accessToken: string) => void;
  setToken: (accessToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<UserDto>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => {
  // Setup BroadcastChannel for tab synchronization
  const authChannel = new BroadcastChannel("auth_sync");

  authChannel.onmessage = (event) => {
    if (event.data === "logout") {
      set({ user: null, accessToken: null, isLoggedIn: false });
    } else if (event.data === "login") {
      // You could trigger a fetch of /auth/me here if necessary,
      // but usually just forcing a reload or clearing state is enough
      // to let the app naturally refetch the user on mount if needed.
    }
  };

  return {
    user: null,
    accessToken: null,
    isLoggedIn: false,
    isLoading: true, // Initially true to allow for `/auth/me` on mount

    setAuth: (user, accessToken) => {
      set({ user, accessToken, isLoggedIn: true, isLoading: false });
      authChannel.postMessage("login");
    },

    setToken: (accessToken) => set({ accessToken }),

    logout: () => {
      set({ user: null, accessToken: null, isLoggedIn: false, isLoading: false });
      authChannel.postMessage("logout");
    },

    updateUser: (data) => {
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, ...data } });
      }
    },

    setLoading: (isLoading) => set({ isLoading }),
  };
});
