import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "@/services/authService";
import {
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email] = useState((location.state as any)?.email || "");
  const [otpCode, setOtpCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setErrorMsg("Vui lòng nhập đủ 6 số.");
      return;
    }
    if (!email) {
      setErrorMsg("Không tìm thấy email cần xác thực. Vui lòng quay lại.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await authService.verifyEmail({ email, otpCode });
      setSuccessMsg("Xác thực thành công! Đang chuyển trang...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      const code = error.response?.data?.error?.code;
      if (code === "OTP_INVALID") {
        setErrorMsg("❌ Mã xác thực không đúng");
      } else if (code === "OTP_EXPIRED") {
        setErrorMsg("⏰ Mã đã hết hạn. Vui lòng gửi lại");
      } else {
        const errMsg = error.response?.data?.error?.message || error.response?.data?.error;
        if (typeof errMsg === "string") {
            setErrorMsg(errMsg);
        } else {
            setErrorMsg("Đã xảy ra lỗi khi xác thực.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authService.resendVerification(email);
      setCountdown(45);
      setCanResend(false);
      setSuccessMsg("Đã gửi lại mã xác thực.");
    } catch (error: any) {
      if (error.response?.data?.error?.code === "OTP_RATE_LIMIT") {
        setErrorMsg("Gửi quá nhiều lần. Vui lòng đợi.");
      } else {
        setErrorMsg("Lỗi khi gửi lại mã OTP.");
      }
    }
  };

  const maskedEmail = email ? email.replace(/(^.{1})(.*)(@.*$)/, '$1***$3') : '';

  return (
    <>
      <CardHeader className="text-center">
        <div className="text-4xl mb-4">✉️</div>
        <CardTitle className="text-2xl tracking-tight">Kiểm tra hộp thư của bạn</CardTitle>
        <CardDescription className="mt-2">
          Chúng tôi đã gửi mã OTP đến <br />
          <strong className="text-foreground">{maskedEmail || 'email của bạn'}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {errorMsg && (
          <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center font-medium border border-destructive/20">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-md bg-green-500/15 p-3 text-sm text-green-600 text-center font-medium border border-green-500/20">
            ✅ {successMsg}
          </div>
        )}

        {!successMsg.includes("thành công") && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block text-center">
                Nhập mã xác thực (6 chữ số)
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

            <Button type="button" className="w-full" onClick={handleVerify} disabled={isSubmitting || otpCode.length !== 6}>
              {isSubmitting ? "Đang xác thực..." : "Xác thực"}
            </Button>

            <div className="text-center text-sm space-y-4">
              <div>
                <span className="text-muted-foreground mr-1">Không nhận được mã?</span>
                {canResend ? (
                  <button type="button" onClick={handleResend} className="text-primary hover:underline font-medium">
                    Gửi lại OTP
                  </button>
                ) : (
                  <span className="text-muted-foreground">Gửi lại ({countdown} giây)</span>
                )}
              </div>
              <div>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
}
