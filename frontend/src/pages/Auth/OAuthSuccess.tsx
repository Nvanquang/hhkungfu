import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";

export default function OAuthSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const bootstrap = async () => {
      try {
        // Set access token so subsequent calls include Authorization header
        useAuthStore.getState().setToken(token);
        const user = await authService.getMe();
        useAuthStore.getState().setAuth(user, token);
        navigate("/", { replace: true });
      } catch {
        useAuthStore.getState().logout();
        navigate("/login", { replace: true });
      }
    };

    void bootstrap();
  }, [location.search, navigate]);

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      Đang xử lý đăng nhập với Google...
    </div>
  );
}

