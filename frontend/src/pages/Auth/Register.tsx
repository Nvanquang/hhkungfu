import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
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

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  username: z.string().min(3, "Tối thiểu 3 ký tự").max(50, "Tối đa 50 ký tự").regex(/^[a-z0-9_]+$/, "Chỉ dùng a-z, 0-9, dấu gạch dưới"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const { formState: { isSubmitting }, watch } = form;
  const passwordValue = watch("password", "");

  useEffect(() => {
    let strength = 0;
    if (passwordValue.length >= 8) strength += 25;
    if (/[A-Z]/.test(passwordValue)) strength += 25;
    if (/[0-9]/.test(passwordValue)) strength += 25;
    if (/[^A-Za-z0-9]/.test(passwordValue)) strength += 25;
    setPasswordStrength(strength);
  }, [passwordValue]);

  const strengthLabel =
    passwordStrength === 0 ? "" :
      passwordStrength <= 25 ? "Yếu" :
        passwordStrength <= 50 ? "Trung bình" :
          passwordStrength <= 75 ? "Tốt" : "Mạnh";

  type HttpError = {
    response?: {
      data?: { error?: { code?: string; message?: string } | string };
    };
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setGlobalError("");
      const result = await authService.register(data);
      // Backend automatically sends email according to docs
      toast.success(result.message);
      // Redirect to verify email page
      navigate("/verify-email", { state: { email: data.email } });
    } catch (error: unknown) {
      const e = error as HttpError;
      const code = typeof e.response?.data?.error === "object" ? e.response?.data?.error?.code : undefined;
      const msg = typeof e.response?.data?.error === "object" ? e.response?.data?.error?.message : e.response?.data?.error;
      if (code === "EMAIL_ALREADY_EXISTS") {
        setGlobalError("Email đã được sử dụng.");
      } else if (code === "USERNAME_ALREADY_EXISTS") {
        setGlobalError("Tên người dùng đã tồn tại.");
      } else {
        if (typeof msg === "string") {
          setGlobalError(msg);
        } else {
          setGlobalError("Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.");
        }
      }
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = "/oauth2/authorization/google";
  };

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl tracking-tight">Tạo tài khoản mới</CardTitle>
        <CardDescription>Miễn phí · Xem ngay hàng nghìn anime</CardDescription>
      </CardHeader>

      <CardContent>
        {globalError && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">
            ❌ {globalError}
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
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên người dùng</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="naruto_fan" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">Chỉ dùng a-z, 0-9, dấu gạch dưới</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="••••••••••" {...field} />
                  </FormControl>
                  {passwordValue.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden flex">
                        <div className={`h-full transition-all ${passwordStrength <= 25 ? 'bg-destructive' :
                          passwordStrength <= 50 ? 'bg-yellow-500' :
                            passwordStrength <= 75 ? 'bg-green-500' : 'bg-green-700'
                          }`} style={{ width: `${passwordStrength}%` }} />
                      </div>
                      <span className="text-xs font-medium w-24 text-right">Độ mạnh: {strengthLabel}</span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
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

        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleRegister}>
          <img src="/logos/logo-gg.png" alt="Google" className="h-4" /> Đăng ký với Google
        </Button>

        <div className="mt-6 text-center text-sm">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Đăng nhập
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Bằng cách đăng ký, bạn đồng ý với <a href="#" className="underline">Điều khoản dịch vụ</a> và <a href="#" className="underline">Chính sách bảo mật</a> của Hhkungfu.
        </div>
      </CardContent>
    </>
  );
}
