import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import {
  Button,
  Input,
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [successEmail, setSuccessEmail] = useState("");
  const [globalError, setGlobalError] = useState("");

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setGlobalError("");
      const result = await authService.forgotPassword(data);
      toast.success(result.message);
      setSuccessEmail(data.email);
    } catch (error: any) {
      if (error.response?.data?.error?.code === "OTP_RATE_LIMIT") {
        setGlobalError("Gửi quá nhiều lần. Vui lòng đợi.");
      } else {
        const errMsg = error.response?.data?.error?.message || error.response?.data?.error;
        if (typeof errMsg === "string") {
            setGlobalError(errMsg);
        } else {
            setGlobalError("Đã xảy ra lỗi. Vui lòng thử lại.");
        }
      }
    }
  };

  if (successEmail) {
    const maskedEmail = successEmail.replace(/(^.{1})(.*)(@.*$)/, '$1***$3');
    return (
      <>
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">✉️</div>
          <CardTitle className="text-2xl tracking-tight">Đã gửi!</CardTitle>
          <CardDescription className="mt-2">
            Kiểm tra email <strong>{maskedEmail}</strong>
            <br />
            OTP có hiệu lực trong 5 phút
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full mb-4" onClick={() => navigate("/reset-password", { state: { email: successEmail } })}>
            Nhập mã khôi phục →
          </Button>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader className="text-center">
        <div className="text-4xl mb-4">🔑</div>
        <CardTitle className="text-2xl tracking-tight">Quên mật khẩu?</CardTitle>
        <CardDescription className="mt-2">
          Nhập email và chúng tôi sẽ gửi mã<br />khôi phục mật khẩu cho bạn.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {globalError && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center font-medium border border-destructive/20">
            {globalError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi mã khôi phục"}
            </Button>

            <div className="text-center text-sm">
              <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                ← Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  );
}
