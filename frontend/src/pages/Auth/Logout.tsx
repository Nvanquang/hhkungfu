import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { toast } from "sonner";

export default function Logout() {
  const navigate = useNavigate();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;
    hasLoggedOut.current = true;

    const performLogout = async () => {
      try {
        // authService.logout() already handles clearing useAuthStore state 
        // before calling the backend API.
        const res = await authService.logout();
        toast.success(res.message);
      } catch (error) {
        console.error("Lỗi khi gọi API logout:", error);
      } finally {
        navigate("/login", { replace: true });
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl tracking-tight">Đang đăng xuất...</CardTitle>
        <CardDescription>Vui lòng đợi trong giây lát</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </CardContent>
    </>
  );
}
