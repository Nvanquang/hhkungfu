import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";

export const useAuthInit = () => {
  const { setLoading, setAuth, logout } = useAuthStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      // Prevent double init in StrictMode
      if (isInitialized.current) return;
      isInitialized.current = true;

      try {
        setLoading(true);
        // By calling /auth/me, the API client tries to fetch the user.
        // If there is no access token but an HttpOnly cookie exists, the backend
        // returns 401, which triggers our apiClient interceptor to refresh, get
        // a new access token, then fetch user. If no cookie, it fails, and 
        // they get logged out.
        const user = await authService.getMe();
        const token = useAuthStore.getState().accessToken;
        
        if (token && user) {
           setAuth(user, token);
        } else {
           logout();
        }
      } catch (err) {
         // Attempted to fetch me, failed (likely no valid refresh token either)
         logout();
      } finally {
         setLoading(false);
      }
    };

    initAuth();
  }, [setLoading, setAuth, logout]);
};
