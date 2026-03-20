import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import {
  Button,
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email] = useState(() => {
    const state: unknown = location.state;
    return state && typeof state === "object" && "email" in state && typeof (state as { email?: unknown }).email === "string"
      ? String((state as { email?: unknown }).email)
      : "";
  });
  const [otpCode, setOtpCode] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
    },
  });

  const { formState: { isSubmitting }, watch } = form;
  const passwordValue = watch("newPassword", "");

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

  const onSubmit = async (data: ResetPasswordData) => {
    if (otpCode.length !== 6) {
      setGlobalError("Vui lòng nhập đủ 6 số OTP.");
      return;
    }
    if (!email) {
      setGlobalError("Không tìm thấy email. Vui lòng bắt đầu lại từ trang 'Quên mật khẩu'.");
      return;
    }

    try {
      setGlobalError("");
      const result = await authService.resetPassword({ email, otpCode, newPassword: data.newPassword });
      toast.success(result.message);
      setIsSuccess(true);
    } catch (error: unknown) {
      const e = error as HttpError;
      const code = typeof e.response?.data?.error === "object" ? e.response?.data?.error?.code : undefined;
      const msg = typeof e.response?.data?.error === "object" ? e.response?.data?.error?.message : e.response?.data?.error;
      if (code === "OTP_INVALID") {
        setGlobalError("Mã xác thực không đúng hoặc đã dùng.");
      } else if (code === "OTP_EXPIRED") {
        setGlobalError("Mã đã hết hạn. Vui lòng gửi lại.");
      } else if (code === "WEAK_PASSWORD") {
        setGlobalError("Mật khẩu không đủ mạnh.");
      } else {
        if (typeof msg === "string") {
            setGlobalError(msg);
        } else {
            setGlobalError("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
      }
    }
  };

  if (isSuccess) {
    return (
      <>
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <CardTitle className="text-2xl tracking-tight">Mật khẩu đã được đặt lại!</CardTitle>
          <CardDescription className="mt-2">
            Tất cả thiết bị đã được đăng xuất.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Đăng nhập ngay →
          </Button>
        </CardContent>
      </>
    );
  }

  const maskedEmail = email ? email.replace(/(^.{1})(.*)(@.*$)/, '$1***$3') : '';

  return (
    <>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl tracking-tight">Đặt lại mật khẩu</CardTitle>
        <CardDescription className="mt-2">
          Mã OTP đã gửi đến <strong>{maskedEmail || 'email của bạn'}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {globalError && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center font-medium border border-destructive/20">
            ❌ {globalError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block text-center">
                Mã xác thực (6 chữ số)
              </label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
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

            <Button type="submit" className="w-full" disabled={isSubmitting || otpCode.length !== 6}>
              {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>

            <div className="text-center text-sm">
              <Link to="/forgot-password" className="text-muted-foreground hover:text-primary transition-colors">
                ← Gửi lại OTP
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );
}
