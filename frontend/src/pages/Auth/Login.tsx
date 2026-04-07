import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
import { scheduleRefresh } from "@/services/tokenService";
import { webSocketService } from "@/services/websocketService";
import { triggerSilentRefresh } from "@/services/apiClient";
import {
  Button,
  Input,
  PasswordInput,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [globalError, setGlobalError] = useState("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  type HttpError = {
    response?: {
      status?: number;
      data?: { error?: { code?: string; message?: string } | string };
    };
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setGlobalError("");
      // authService.login now returns AuthResponse directly (no .data wrapper)
      const { user, accessToken } = await authService.login(data);

      // Store token + user in memory
      setToken(accessToken);
      setUser(user);

      // Schedule proactive refresh + connect WS
      scheduleRefresh(accessToken, () => {
        void triggerSilentRefresh();
      });
      webSocketService.connectWithToken(accessToken);

      toast.success("Đăng nhập thành công");

      const destination = user.role === "ADMIN" ? "/admin" : "/";
      navigate(destination, { replace: true });
    } catch (error: unknown) {
      const e = error as HttpError;
      const code = typeof e.response?.data?.error === "object" ? e.response?.data?.error?.code : undefined;
      const msg = typeof e.response?.data?.error === "object" ? e.response?.data?.error?.message : e.response?.data?.error;

      if (code === "ACCOUNT_DISABLED") {
        setGlobalError("Tài khoản bị tạm khóa bởi admin.");
      } else if (code === "UNAUTHORIZED" || e.response?.status === 401) {
        setGlobalError("Email hoặc mật khẩu không đúng.");
      } else {
        // Fallback catch-all nếu backend trả về error message cụ thể
        if (typeof msg === "string") {
          setGlobalError(msg);
        } else {
          setGlobalError("Đã xảy ra lỗi khi đăng nhập.");
        }
      }
    }
  };


  const handleGoogleLogin = () => {
    // Spring Security OAuth2 login entry point
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl tracking-tight">Chào mừng trở lại</CardTitle>
        <CardDescription>Đăng nhập để tiếp tục xem anime</CardDescription>
      </CardHeader>

      <CardContent>
        {globalError && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">
            {globalError.includes("khóa") ? "🔒" : "❌"} {globalError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Mật khẩu</FormLabel>
                    <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                      Quên?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput placeholder="••••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">hoặc</span>
          </div>
        </div>

        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
          <img src="/logos/logo-gg.png" alt="Google" className="h-4" /> Tiếp tục với Google
        </Button>

        <div className="mt-6 text-center text-sm">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </div>
      </CardContent>
    </>
  );
}
