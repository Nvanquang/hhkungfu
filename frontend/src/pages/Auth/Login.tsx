import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/authService";
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
  const setAuth = useAuthStore((state) => state.setAuth);
  const [globalError, setGlobalError] = useState("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: LoginFormData) => {
    try {
      setGlobalError("");
      const result = await authService.login(data);
      setAuth(result.data.user, result.data.accessToken);
      toast.success(result.message); // Hiển thị thông báo thành công từ backend
      navigate("/");
    } catch (error: any) {
      if (error.response?.data?.error?.code === "ACCOUNT_DISABLED") {
        setGlobalError("Tài khoản bị tạm khóa bởi admin.");
      } else if (error.response?.data?.error?.code === "UNAUTHORIZED" || error.response?.status === 401) {
        setGlobalError("Email hoặc mật khẩu không đúng.");
      } else {
        // Fallback catch-all nếu backend trả về error message cụ thể
        const errMsg = error.response?.data?.error?.message || error.response?.data?.error;
        if (typeof errMsg === "string") {
          setGlobalError(errMsg);
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
