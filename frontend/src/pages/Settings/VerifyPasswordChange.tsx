import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirmChangePassword } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

export default function VerifyPasswordChange() {
  const [otpCode, setOtpCode] = useState("");
  const navigate = useNavigate();
  const confirmChange = useConfirmChangePassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;

    confirmChange.mutate(
      { otpCode },
      {
        onSuccess: () => {
          navigate("/settings");
        },
      }
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur-md">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Xác nhận đổi mật khẩu</CardTitle>
          <CardDescription>
            Vui lòng nhập mã OTP 6 số đã được gửi tới email của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">Mã xác thực (OTP)</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[1em] font-mono h-14"
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-lg"
              disabled={confirmChange.isPending || otpCode.length !== 6}
            >
              {confirmChange.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Xác nhận thay đổi
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Không nhận được mã? <button type="button" className="text-primary hover:underline" onClick={() => navigate(-1)}>Gửi lại yêu cầu</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
